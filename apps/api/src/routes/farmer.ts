import type { FastifyInstance } from 'fastify';
import { prisma } from '@chaya/shared';
import { authenticate, verifyAdmin, type AuthenticatedRequest } from '../middlewares/auth';
import { createFarmerSchema, updateFarmerSchema, farmerQuerySchema } from '@chaya/shared';
import { Prisma } from '@chaya/shared';
import { generateSurveyNumber } from '../helper';

async function farmerRoutes(fastify: FastifyInstance) {
	fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
		try {
			const query = farmerQuerySchema.parse(request.query);

			const page = query.page || 1;
			const limit = query.limit || 10;
			const skip = (page - 1) * limit;

			const where: Prisma.FarmerWhereInput = {
				isActive: query.isActive,
			};

			if (query.search) {
				where.OR = [
					{ name: { contains: query.search, mode: 'insensitive' } },
					{ surveyNumber: { contains: query.search, mode: 'insensitive' } },
					{ aadharNumber: { contains: query.search, mode: 'insensitive' } },
					{ contactNumber: { contains: query.search, mode: 'insensitive' } },
				];
			}

			if (query.state) where.state = query.state;
			if (query.district) where.district = query.district;
			if (query.gender) where.gender = query.gender;

			const [farmers, totalCount] = await Promise.all([
				prisma.farmer.findMany({
					where,
					include: {
						documents: true,
						bankDetails: true,
						fields: true,
						createdBy: {
							select: {
								id: true,
								name: true,
							},
						},
					},
					orderBy: { createdAt: 'desc' },
					skip,
					take: limit,
				}),
				prisma.farmer.count({ where }),
			]);

			return {
				farmers,
				pagination: {
					page,
					limit,
					totalCount,
					totalPages: Math.ceil(totalCount / limit),
				},
			};
		} catch (error) {
			console.error('Get farmers error:', error);
			return reply.status(400).send({ error: 'Invalid query parameters' });
		}
	});

	fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
		try {
			const { id } = request.params as { id: string };

			const farmer = await prisma.farmer.findUnique({
				where: { id: parseInt(id) },
				include: {
					documents: true,
					bankDetails: true,
					fields: true,
					createdBy: {
						select: {
							id: true,
							name: true,
						},
					},
					updatedBy: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});

			if (!farmer) {
				return reply.status(404).send({ error: 'Farmer not found' });
			}

			return { farmer };
		} catch (error) {
			console.error('Get farmer error:', error);
			return reply.status(500).send({ error: 'Server error' });
		}
	});

	fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
		try {
			const authRequest = request as AuthenticatedRequest;
			const { farmer, bankDetails, documents, fields } = createFarmerSchema.parse(request.body);

			const existingFarmer = await prisma.farmer.findFirst({
				where: {
					OR: [{ surveyNumber: farmer.surveyNumber }, { aadharNumber: farmer.aadharNumber }],
				},
			});

			if (existingFarmer) {
				return reply.status(400).send({
					error: 'A farmer with this survey number or Aadhar number already exists',
				});
			}
			const surveyNumber = await generateSurveyNumber();
			const newFarmer = await prisma.farmer.create({
				data: {
					...farmer,
					surveyNumber,
					createdById: authRequest.user.id,
					updatedById: authRequest.user.id,
					bankDetails: {
						create: bankDetails,
					},
					documents: {
						create: documents,
					},
					fields: {
						create: fields || [],
					},
				},
				include: {
					bankDetails: true,
					documents: true,
					fields: true,
				},
			});

			return { farmer: newFarmer };
		} catch (error) {
			console.error('Create farmer error:', error);
			if ((error as any).code === 'P2002') {
				return reply.status(400).send({ error: 'Unique constraint violation' });
			}
			return reply.status(400).send({ error: 'Invalid request data' });
		}
	});

	fastify.put('/:id', { preHandler: verifyAdmin }, async (request, reply) => {
		try {
			const authRequest = request as AuthenticatedRequest;
			const { id } = request.params as { id: string };
			const updateData = updateFarmerSchema.parse(request.body);

			// Check if farmer exists
			const existingFarmer = await prisma.farmer.findUnique({
				where: { id: parseInt(id) },
				include: {
					bankDetails: true,
					documents: true,
					fields: true,
				},
			});

			if (!existingFarmer) {
				return reply.status(404).send({ error: 'Farmer not found' });
			}

			// Start a transaction to update all related entities
			const updatedFarmer = await prisma.$transaction(async (tx) => {
				// 1. Update farmer main data
				const farmer = await tx.farmer.update({
					where: { id: parseInt(id) },
					data: {
						...updateData.farmer,
						updatedById: authRequest.user.id,
					},
				});

				// 2. Update bank details if provided
				if (updateData.bankDetails && existingFarmer.bankDetails) {
					await tx.bankDetails.update({
						where: { farmerId: farmer.id },
						data: updateData.bankDetails,
					});
				} else if (updateData.bankDetails && !existingFarmer.bankDetails) {
					// Check if all required fields are present
					if (
						!updateData.bankDetails.ifscCode ||
						!updateData.bankDetails.bankName ||
						!updateData.bankDetails.branchName ||
						!updateData.bankDetails.accountNumber ||
						!updateData.bankDetails.address ||
						!updateData.bankDetails.bankCode
					) {
						throw new Error('All bank details fields are required when creating new bank details');
					}

					// Now create with all fields
					await tx.bankDetails.create({
						data: {
							ifscCode: updateData.bankDetails.ifscCode,
							bankName: updateData.bankDetails.bankName,
							branchName: updateData.bankDetails.branchName,
							accountNumber: updateData.bankDetails.accountNumber,
							address: updateData.bankDetails.address,
							bankCode: updateData.bankDetails.bankCode,
							farmerId: farmer.id,
						},
					});
				}

				// 3. Update documents if provided
				if (updateData.documents && existingFarmer.documents) {
					await tx.farmerDocuments.update({
						where: { farmerId: farmer.id },
						data: updateData.documents,
					});
				} else if (updateData.documents && !existingFarmer.documents) {
					// Check if all required fields are present
					if (!updateData.documents.profilePicUrl || !updateData.documents.aadharDocUrl || !updateData.documents.bankDocUrl) {
						throw new Error('All document URLs are required when creating new documents');
					}

					await tx.farmerDocuments.create({
						data: {
							profilePicUrl: updateData.documents.profilePicUrl,
							aadharDocUrl: updateData.documents.aadharDocUrl,
							bankDocUrl: updateData.documents.bankDocUrl,
							farmerId: farmer.id,
						},
					});
				}

				// 4. Handle fields if provided (more complex)
				if (updateData.fields?.length) {
					// Validate each field has all required properties
					const invalidFields = updateData.fields.filter((field) => !field.areaHa || !field.yieldEstimate || !field.location || !field.landDocumentUrl);

					if (invalidFields.length > 0) {
						throw new Error('All field properties are required when creating new fields');
					}

					// Delete existing fields
					await tx.field.deleteMany({
						where: { farmerId: farmer.id },
					});

					// Now create with fields that we know have all properties
					await tx.field.createMany({
						data: updateData.fields.map((field) => ({
							areaHa: field.areaHa!,
							yieldEstimate: field.yieldEstimate!,
							location: field.location!,
							landDocumentUrl: field.landDocumentUrl!,
							farmerId: farmer.id,
						})),
					});
				}

				// Return updated farmer with all related data
				return tx.farmer.findUnique({
					where: { id: farmer.id },
					include: {
						bankDetails: true,
						documents: true,
						fields: true,
					},
				});
			});

			return { farmer: updatedFarmer };
		} catch (error) {
			console.error('Update farmer error:', error);
			// If it's a validation error we threw, return 400
			if (error instanceof Error && error.message.includes('required')) {
				return reply.status(400).send({ error: error.message });
			}
			return reply.status(400).send({ error: 'Invalid request data' });
		}
	});

	fastify.patch('/:id/toggle-status', { preHandler: verifyAdmin }, async (request, reply) => {
		try {
			const { id } = request.params as { id: string };
			const authRequest = request as AuthenticatedRequest;

			const farmer = await prisma.farmer.findUnique({
				where: { id: parseInt(id) },
			});

			if (!farmer) {
				return reply.status(404).send({ error: 'Farmer not found' });
			}

			const updatedFarmer = await prisma.farmer.update({
				where: { id: parseInt(id) },
				data: {
					isActive: !farmer.isActive,
					updatedById: authRequest.user.id,
				},
				include: {
					bankDetails: true,
					documents: true,
				},
			});

			return { farmer: updatedFarmer };
		} catch (error) {
			console.error('Toggle farmer status error:', error);
			return reply.status(500).send({ error: 'Server error' });
		}
	});

	fastify.delete('/:id', { preHandler: verifyAdmin }, async (request, reply) => {
		try {
			const { id } = request.params as { id: string };

			const farmer = await prisma.farmer.findUnique({
				where: { id: parseInt(id) },
			});

			if (!farmer) {
				return reply.status(404).send({ error: 'Farmer not found' });
			}

			await prisma.farmer.delete({
				where: { id: parseInt(id) },
			});

			return { success: true };
		} catch (error) {
			console.error('Delete farmer error:', error);
			return reply.status(500).send({ error: 'Server error' });
		}
	});

	fastify.get('/export', { preHandler: authenticate }, async (request, reply) => {
		try {
			const query = farmerQuerySchema.parse(request.query);

			const where: Prisma.FarmerWhereInput = {
				isActive: query.isActive,
			};

			if (query.search) {
				where.OR = [
					{ name: { contains: query.search, mode: 'insensitive' } },
					{ surveyNumber: { contains: query.search, mode: 'insensitive' } },
					{ aadharNumber: { contains: query.search, mode: 'insensitive' } },
					{ contactNumber: { contains: query.search, mode: 'insensitive' } },
				];
			}

			if (query.state) where.state = query.state;
			if (query.district) where.district = query.district;
			if (query.gender) where.gender = query.gender;

			const limit = query.limit || 1000;

			const farmers = await prisma.farmer.findMany({
				where,
				include: {
					bankDetails: true,
				},
				orderBy: { name: 'asc' },
				take: limit,
			});

			const csvData = farmers.map((farmer) => ({
				ID: farmer.id,
				SurveyNumber: farmer.surveyNumber,
				Name: farmer.name,
				Gender: farmer.gender,
				Community: farmer.community,
				AadharNumber: farmer.aadharNumber,
				State: farmer.state,
				District: farmer.district,
				Mandal: farmer.mandal,
				Village: farmer.village,
				Panchayath: farmer.panchayath,
				DateOfBirth: farmer.dateOfBirth.toISOString().split('T')[0],
				Age: farmer.age,
				ContactNumber: farmer.contactNumber,
				BankName: farmer.bankDetails?.bankName || '',
				BranchName: farmer.bankDetails?.branchName || '',
				AccountNumber: farmer.bankDetails?.accountNumber || '',
				IFSC: farmer.bankDetails?.ifscCode || '',
			}));

			const headers = Object.keys(csvData[0] || {}).join(',');

			const rows = csvData.map((row) => {
				return Object.values(row)
					.map((value) => {
						if (typeof value === 'string') {
							return `"${value.replace(/"/g, '""')}"`;
						}
						return value;
					})
					.join(',');
			});

			const csv = [headers, ...rows].join('\n');

			reply.header('Content-Type', 'text/csv');
			reply.header('Content-Disposition', 'attachment; filename=farmers.csv');

			return csv;
		} catch (error) {
			console.error('Export farmers error:', error);
			return reply.status(400).send({ error: 'Invalid query parameters' });
		}
	});
}

export default farmerRoutes;
