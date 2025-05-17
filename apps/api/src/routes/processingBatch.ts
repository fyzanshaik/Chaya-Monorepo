import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'; // Added FastifyRequest
import { prisma, Prisma } from '@chaya/shared';
import { authenticate, verifyAdmin, type AuthenticatedRequest } from '../middlewares/auth';
import {
  createProcessingBatchSchema,
  processingBatchQuerySchema,
  // Schemas below are for stages, moved their usage to processingStage.ts generally
  // createProcessingStageSchema,
  // finalizeProcessingStageSchema,
  // createDryingEntrySchema
} from '@chaya/shared';
import { generateProcessingBatchCode } from '../helper';
import Redis from 'ioredis';

const redis = new Redis();

async function invalidateProcessingCache(batchId?: number | string) {
  // Removed stageId from here
  const keysToDelete: string[] = [];
  const listKeys = await redis.keys('processing-batches:list:*');
  if (listKeys.length) keysToDelete.push(...listKeys);
  if (batchId) keysToDelete.push(`processing-batch:${batchId}`);
  if (keysToDelete.length) await redis.del(...keysToDelete);
}

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

      const processingBatchCode = await generateProcessingBatchCode(crop, lotNo, firstStageDetails.dateOfProcessing);

      const result = await prisma.$transaction(async tx => {
        const newBatch = await tx.processingBatch.create({
          data: {
            batchCode: processingBatchCode,
            crop,
            lotNo,
            initialBatchQuantity,
            createdById: userId,
            procurements: { connect: procurementIds.map(id => ({ id })) },
          },
        });

        const firstStage = await tx.processingStage.create({
          data: {
            processingBatchId: newBatch.id,
            processingCount: 1,
            processMethod: firstStageDetails.processMethod,
            dateOfProcessing: firstStageDetails.dateOfProcessing,
            doneBy: firstStageDetails.doneBy,
            initialQuantity: initialBatchQuantity,
            status: 'IN_PROGRESS',
            createdById: userId,
          },
        });

        // No explicit update needed for procurements if `connect` works as expected
        // in the `ProcessingBatch` creation to set the `processingBatchId`.
        // However, Prisma relations sometimes need explicit two-way updates or careful handling
        // of which side "owns" the foreign key. If `processingBatchId` isn't automatically set on Procurement,
        // an `updateMany` here would be necessary. Assuming `connect` sets the FK.

        return { batch: newBatch, firstStage };
      });

      await invalidateProcessingCache();
      return reply.status(201).send(result);
    } catch (error: any) {
      if (error.issues) return reply.status(400).send({ error: 'Invalid request data', details: error.issues });
      console.error('Create processing batch error:', error);
      return reply.status(500).send({ error: 'Server error creating processing batch' });
    }
  });

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

      let batchIdsFilteredByStatus: number[] | undefined = undefined;

      if (query.status) {
        const batchesWithLatestStageStatus = await prisma.processingBatch.findMany({
          select: {
            id: true,
            processingStages: {
              orderBy: { processingCount: 'desc' },
              take: 1,
              select: { status: true },
            },
          },
        });
        batchIdsFilteredByStatus = batchesWithLatestStageStatus
          .filter(b => b.processingStages.length > 0 && b.processingStages[0].status === query.status)
          .map(b => b.id);

        if (batchIdsFilteredByStatus.length === 0 && query.status) {
          return { processingBatches: [], pagination: { page, limit, totalCount: 0, totalPages: 0 } };
        }
        if (batchIdsFilteredByStatus) {
          where.id = { in: batchIdsFilteredByStatus };
        }
      }

      const [batches, totalCount] = await Promise.all([
        prisma.processingBatch.findMany({
          where,
          include: {
            procurements: { select: { id: true, batchCode: true, quantity: true } },
            processingStages: {
              orderBy: { processingCount: 'desc' },
              take: 1,
              include: { dryingEntries: { orderBy: { day: 'desc' }, take: 1 } },
            },
            sales: { select: { quantitySold: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.processingBatch.count({ where }),
      ]);

      const transformedBatches = batches.map(batch => {
        const latestStage = batch.processingStages[0];
        let currentStageDisplayQuantity = 0;
        let lastDryingQuantityForLatestStage = null;

        if (latestStage) {
          if (latestStage.status === 'IN_PROGRESS') {
            if (latestStage.dryingEntries[0]) {
              lastDryingQuantityForLatestStage = latestStage.dryingEntries[0].currentQuantity;
              currentStageDisplayQuantity = latestStage.dryingEntries[0].currentQuantity;
            } else {
              currentStageDisplayQuantity = latestStage.initialQuantity;
            }
          } else if (latestStage.status === 'FINISHED') {
            currentStageDisplayQuantity = latestStage.quantityAfterProcess || 0;
          }
        } else {
          currentStageDisplayQuantity = batch.initialBatchQuantity;
        }

        const totalQuantitySoldFromBatch = batch.sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
        const netAvailableFromBatchOverall = currentStageDisplayQuantity - totalQuantitySoldFromBatch;

        return {
          ...batch,
          latestStageSummary: latestStage
            ? {
                id: latestStage.id,
                processingCount: latestStage.processingCount,
                status: latestStage.status,
                processMethod: latestStage.processMethod,
                dateOfProcessing: latestStage.dateOfProcessing,
                doneBy: latestStage.doneBy,
                initialQuantity: latestStage.initialQuantity,
                quantityAfterProcess: latestStage.quantityAfterProcess,
                lastDryingQuantity: lastDryingQuantityForLatestStage,
              }
            : null,
          totalQuantitySoldFromBatch,
          currentStageDisplayQuantity,
          netAvailableFromBatch: Math.max(0, netAvailableFromBatchOverall),
        };
      });

      const result = {
        processingBatches: transformedBatches,
        pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
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
      if (cached) return JSON.parse(cached);

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
      const batchWithDetails = { ...batch, totalQuantitySoldFromBatch };

      await redis.set(cacheKey, JSON.stringify(batchWithDetails), 'EX', 3600);
      return batchWithDetails;
    } catch (error) {
      console.error(`Error fetching batch ${id}:`, error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.delete('/:batchId', { preHandler: [verifyAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    // const adminUser = (request as AuthenticatedRequest).user;
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
}

export default processingBatchRoutes;
