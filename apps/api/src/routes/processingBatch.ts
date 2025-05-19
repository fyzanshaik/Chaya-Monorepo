import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma, Prisma, ProcessingStageStatus as PrismaProcessingStageStatus } from '@chaya/shared';
import { authenticate, verifyAdmin, type AuthenticatedRequest } from '../middlewares/auth';
import { createProcessingBatchSchema, processingBatchQuerySchema } from '@chaya/shared';
import { generateProcessingBatchCode } from '../helper'; // Ensure this uses the global prisma, not 'tx'
import Redis from 'ioredis';

const redis = new Redis();

// ... (invalidateProcessingCache and ExtendedProcessingStageStatus type) ...
async function invalidateProcessingCache(batchId?: number | string) {
  const keysToDelete: string[] = [];
  const listKeys = await redis.keys('processing-batches:list:*');
  if (listKeys.length) keysToDelete.push(...listKeys);
  if (batchId) keysToDelete.push(`processing-batch:${batchId}`);
  if (keysToDelete.length) await redis.del(...keysToDelete);
}

type ExtendedProcessingStageStatus = PrismaProcessingStageStatus | 'SOLD_OUT' | 'NO_STAGES';

async function processingBatchRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = (request as AuthenticatedRequest).user;
    try {
      const { crop, lotNo, procurementIds, firstStageDetails } = createProcessingBatchSchema.parse(request.body);
      const userId = authUser.id;

      if (!procurementIds || procurementIds.length === 0) {
        return reply.status(400).send({ error: 'At least one procurement ID must be provided.' });
      }

      const procurements = await prisma.procurement.findMany({
        where: {
          id: { in: procurementIds },
          crop: { equals: crop, mode: 'insensitive' },
          lotNo: lotNo,
          processingBatchId: null,
        },
      });

      if (procurements.length !== procurementIds.length) {
        return reply
          .status(400)
          .send({ error: 'One or more procurement IDs are invalid, do not match crop/lot, or are already batched.' });
      }

      const initialBatchQuantity = procurements.reduce((sum, p) => sum + p.quantity, 0);
      if (initialBatchQuantity <= 0) {
        return reply.status(400).send({ error: 'Total quantity for the batch must be positive.' });
      }

      // 1. Generate the batch code *before* starting the transaction.
      // The dateOfProcessing from firstStageDetails is a string, convert to Date for the helper.
      const dateForBatchCode = new Date(firstStageDetails.dateOfProcessing);
      if (isNaN(dateForBatchCode.getTime())) {
        return reply.status(400).send({ error: 'Invalid dateOfProcessing for batch code generation.' });
      }
      const uniqueProcessingBatchCode = await generateProcessingBatchCode(crop, lotNo, dateForBatchCode);

      const result = await prisma.$transaction(
        async tx => {
          const newBatch = await tx.processingBatch.create({
            data: {
              batchCode: uniqueProcessingBatchCode, // Use the pre-generated code
              crop,
              lotNo,
              initialBatchQuantity,
              createdById: userId,
              procurements: { connect: procurementIds.map(id => ({ id })) },
            },
          });

          // firstStageDetails.dateOfProcessing is a string from Zod, convert to Date for Prisma
          const p1DateOfProcessing = new Date(firstStageDetails.dateOfProcessing);
          if (isNaN(p1DateOfProcessing.getTime())) {
            // This should ideally be caught by Zod schema validation if it's strict on format
            throw new Error('Invalid dateOfProcessing for P1 stage.');
          }

          await tx.processingStage.create({
            data: {
              processingBatchId: newBatch.id,
              processingCount: 1,
              processMethod: firstStageDetails.processMethod,
              dateOfProcessing: p1DateOfProcessing,
              doneBy: firstStageDetails.doneBy,
              initialQuantity: initialBatchQuantity,
              status: 'IN_PROGRESS',
              createdById: userId,
            },
          });

          // Reload the batch with its first stage for the response, using the transaction client 'tx'
          return tx.processingBatch.findUnique({
            where: { id: newBatch.id },
            include: { processingStages: { orderBy: { processingCount: 'asc' }, take: 1 } },
          });
        },
        {
          maxWait: 10000, // Optional: Increase maxWait if needed (milliseconds)
          timeout: 10000, // Optional: Increase timeout if needed (milliseconds)
        }
      ); // End of transaction

      await invalidateProcessingCache();
      return reply.status(201).send({ batch: result }); // Send the result of the transaction
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2028') {
        console.error('Transaction timeout error:', error);
        return reply.status(500).send({ error: 'Server operation timed out, please try again.' });
      }
      if (error.issues) return reply.status(400).send({ error: 'Invalid request data', details: error.issues });
      console.error('Create processing batch error:', error);
      return reply.status(500).send({ error: 'Server error creating processing batch' });
    }
  });

  // ... (GET list and GET by ID routes remain the same as previously corrected) ...
  fastify.get('/', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = processingBatchQuerySchema.parse(request.query);
    const cacheKey = `processing-batches:list:${JSON.stringify(query)}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const where: Prisma.ProcessingBatchWhereInput = {};
      if (query.search) {
        where.OR = [
          { batchCode: { contains: query.search, mode: 'insensitive' } },
          { crop: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      const queryStatus = query.status as ExtendedProcessingStageStatus | undefined;
      const applySoldOutFilterLogic = queryStatus === 'SOLD_OUT';

      if (
        queryStatus &&
        !applySoldOutFilterLogic &&
        Object.values(PrismaProcessingStageStatus).includes(queryStatus as PrismaProcessingStageStatus)
      ) {
        const batchesWithLatestStageStatus = await prisma.processingBatch.findMany({
          where,
          select: {
            id: true,
            processingStages: {
              orderBy: { processingCount: 'desc' },
              take: 1,
              select: { status: true },
            },
          },
        });
        const batchIdsFilteredByStatus = batchesWithLatestStageStatus
          .filter(b => b.processingStages.length > 0 && b.processingStages[0].status === queryStatus)
          .map(b => b.id);

        if (batchIdsFilteredByStatus.length === 0) {
          return { processingBatches: [], pagination: { page, limit, totalCount: 0, totalPages: 0 } };
        }
        if (where.id && typeof where.id === 'object' && !Array.isArray(where.id)) {
          (where.id as Prisma.IntFilter).in = batchIdsFilteredByStatus;
        } else {
          where.id = { in: batchIdsFilteredByStatus };
        }
      }

      const allCandidateBatches = await prisma.processingBatch.findMany({
        where,
        include: {
          procurements: { select: { id: true, procurementNumber: true, quantity: true } },
          processingStages: {
            orderBy: { processingCount: 'desc' },
            take: 1,
            include: { dryingEntries: { orderBy: { day: 'desc' }, take: 1 } },
          },
          sales: { select: { quantitySold: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const transformedAndPossiblyFilteredBatches = allCandidateBatches
        .map(batch => {
          const latestStage = batch.processingStages[0];
          let currentPotentialOutput: number = batch.initialBatchQuantity;
          let stageStatusForSummary: ExtendedProcessingStageStatus = 'NO_STAGES';

          if (latestStage) {
            stageStatusForSummary = latestStage.status;
            if (latestStage.status === 'IN_PROGRESS') {
              currentPotentialOutput = latestStage.dryingEntries[0]?.currentQuantity ?? latestStage.initialQuantity;
            } else if (latestStage.status === 'FINISHED') {
              currentPotentialOutput = latestStage.quantityAfterProcess ?? 0;
            } else if (latestStage.status === 'CANCELLED') {
              currentPotentialOutput = 0;
            }
          }

          const totalQuantitySoldFromBatch = batch.sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
          const netAvailableQuantity = Math.max(0, currentPotentialOutput - totalQuantitySoldFromBatch);

          if (stageStatusForSummary === 'FINISHED' && netAvailableQuantity <= 0) {
            stageStatusForSummary = 'SOLD_OUT';
          }

          return {
            ...batch,
            latestStageSummary: latestStage
              ? {
                  id: latestStage.id,
                  processingCount: latestStage.processingCount,
                  status: stageStatusForSummary,
                  processMethod: latestStage.processMethod,
                  dateOfProcessing: latestStage.dateOfProcessing,
                  doneBy: latestStage.doneBy,
                  initialQuantity: latestStage.initialQuantity,
                  quantityAfterProcess: latestStage.quantityAfterProcess,
                  lastDryingQuantity: latestStage.dryingEntries[0]?.currentQuantity ?? null,
                }
              : null,
            totalQuantitySoldFromBatch,
            netAvailableQuantity,
          };
        })
        .filter(b => {
          if (applySoldOutFilterLogic) {
            return b.latestStageSummary?.status === 'SOLD_OUT';
          }
          return true;
        });

      const finalTotalCount = transformedAndPossiblyFilteredBatches.length;
      const paginatedBatches = transformedAndPossiblyFilteredBatches.slice(skip, skip + limit);

      const result = {
        processingBatches: paginatedBatches,
        pagination: { page, limit, totalCount: finalTotalCount, totalPages: Math.ceil(finalTotalCount / limit) },
      };
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
      return result;
    } catch (error: any) {
      if (error.issues) return reply.status(400).send({ error: 'Invalid query parameters', details: error.issues });
      console.error('Get processing batches error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.get('/:batchId', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { batchId } = request.params as { batchId: string };
    const id = parseInt(batchId);
    if (isNaN(id)) return reply.status(400).send({ error: 'Invalid Batch ID' });

    const cacheKey = `processing-batch:${id}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsedCached = JSON.parse(cached);
        const latestStageForCached = parsedCached.processingStages
          ?.slice()
          .sort((a: any, b: any) => b.processingCount - a.processingCount)[0];
        let currentPotentialOutputCached: number = parsedCached.initialBatchQuantity;
        let effectiveStatusCached: ExtendedProcessingStageStatus = latestStageForCached
          ? latestStageForCached.status
          : 'NO_STAGES';

        if (latestStageForCached) {
          if (latestStageForCached.status === 'IN_PROGRESS') {
            currentPotentialOutputCached =
              latestStageForCached.dryingEntries?.slice().sort((a: any, b: any) => b.day - a.day)[0]?.currentQuantity ??
              latestStageForCached.initialQuantity;
          } else if (latestStageForCached.status === 'FINISHED') {
            currentPotentialOutputCached = latestStageForCached.quantityAfterProcess || 0;
          } else if (latestStageForCached.status === 'CANCELLED') {
            currentPotentialOutputCached = 0;
          }
        }
        const totalSoldCached = parsedCached.sales?.reduce((sum: number, sale: any) => sum + sale.quantitySold, 0) || 0;
        const netAvailableCached = Math.max(0, currentPotentialOutputCached - totalSoldCached);

        if (latestStageForCached && latestStageForCached.status === 'FINISHED' && netAvailableCached <= 0) {
          effectiveStatusCached = 'SOLD_OUT';
        }
        parsedCached.netAvailableQuantity = netAvailableCached;

        // Ensure latestStageSummary exists and update its status
        if (latestStageForCached) {
          parsedCached.latestStageSummary = {
            ...(parsedCached.latestStageSummary || {
              // Create if not exists from old cache
              id: latestStageForCached.id,
              processingCount: latestStageForCached.processingCount,
              processMethod: latestStageForCached.processMethod,
              dateOfProcessing: latestStageForCached.dateOfProcessing,
              doneBy: latestStageForCached.doneBy,
              initialQuantity: latestStageForCached.initialQuantity,
              quantityAfterProcess: latestStageForCached.quantityAfterProcess,
              lastDryingQuantity:
                latestStageForCached.dryingEntries?.slice().sort((a: any, b: any) => b.day - a.day)[0]
                  ?.currentQuantity ?? null,
            }),
            status: effectiveStatusCached,
          };
        } else if (parsedCached.latestStageSummary) {
          parsedCached.latestStageSummary.status = effectiveStatusCached;
        }

        return parsedCached;
      }

      const batch = await prisma.processingBatch.findUnique({
        where: { id },
        include: {
          procurements: { include: { farmer: { select: { name: true, village: true } } } },
          processingStages: {
            include: { dryingEntries: { orderBy: { day: 'asc' } } },
            orderBy: { processingCount: 'asc' },
          },
          sales: {
            orderBy: { dateOfSale: 'desc' },
            include: { processingStage: { select: { processingCount: true } } },
          },
          createdBy: { select: { id: true, name: true } },
        },
      });

      if (!batch) return reply.status(404).send({ error: 'Processing batch not found' });

      const totalQuantitySoldFromBatch = batch.sales.reduce((sum, sale) => sum + sale.quantitySold, 0);

      const latestStage = batch.processingStages?.slice().sort((a, b) => b.processingCount - a.processingCount)[0];
      let currentPotentialOutput: number = batch.initialBatchQuantity;
      let effectiveStatus: ExtendedProcessingStageStatus = latestStage ? latestStage.status : 'NO_STAGES';

      if (latestStage) {
        if (latestStage.status === 'IN_PROGRESS') {
          currentPotentialOutput =
            latestStage.dryingEntries?.slice().sort((a, b) => b.day - a.day)[0]?.currentQuantity ??
            latestStage.initialQuantity;
        } else if (latestStage.status === 'FINISHED') {
          currentPotentialOutput = latestStage.quantityAfterProcess ?? 0;
        } else if (latestStage.status === 'CANCELLED') {
          currentPotentialOutput = 0;
        }
      }
      const netAvailableQuantity = Math.max(0, currentPotentialOutput - totalQuantitySoldFromBatch);

      if (latestStage && latestStage.status === 'FINISHED' && netAvailableQuantity <= 0) {
        effectiveStatus = 'SOLD_OUT';
      }

      const latestStageSummaryData = latestStage
        ? {
            id: latestStage.id,
            processingCount: latestStage.processingCount,
            status: effectiveStatus,
            processMethod: latestStage.processMethod,
            dateOfProcessing: latestStage.dateOfProcessing,
            doneBy: latestStage.doneBy,
            initialQuantity: latestStage.initialQuantity,
            quantityAfterProcess: latestStage.quantityAfterProcess,
            lastDryingQuantity:
              latestStage.dryingEntries?.slice().sort((a, b) => b.day - a.day)[0]?.currentQuantity ?? null,
          }
        : null;

      const batchWithDetails = {
        ...batch,
        totalQuantitySoldFromBatch,
        netAvailableQuantity,
        latestStageSummary: latestStageSummaryData,
      };

      await redis.set(cacheKey, JSON.stringify(batchWithDetails), 'EX', 3600);
      return batchWithDetails;
    } catch (error) {
      console.error(`Error fetching batch ${id}:`, error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.delete('/:batchId', { preHandler: [verifyAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { batchId } = request.params as { batchId: string };
    const id = parseInt(batchId);
    if (isNaN(id)) return reply.status(400).send({ error: 'Invalid Batch ID' });

    try {
      const batch = await prisma.processingBatch.findUnique({ where: { id } });
      if (!batch) return reply.status(404).send({ error: 'Processing batch not found.' });

      await prisma.$transaction(async tx => {
        await tx.procurement.updateMany({
          where: { processingBatchId: id },
          data: { processingBatchId: null },
        });
        await tx.processingBatch.delete({ where: { id } });
      });

      await invalidateProcessingCache(id);
      return { success: true, message: `Processing batch ${batch.batchCode} deleted.` };
    } catch (error) {
      console.error(`Error deleting batch ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return reply.status(404).send({ error: 'Processing batch not found.' });
      }
      return reply.status(500).send({ error: 'Server error deleting batch.' });
    }
  });

  return fastify; // Ensure fastify instance is returned
}

export default processingBatchRoutes;
