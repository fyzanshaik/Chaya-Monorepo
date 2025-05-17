import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma, Prisma } from '@chaya/shared';
import { authenticate, type AuthenticatedRequest } from '../middlewares/auth';
import { createProcessingStageSchema, finalizeProcessingStageSchema, createDryingEntrySchema } from '@chaya/shared';
import Redis from 'ioredis';

const redis = new Redis();

async function invalidateStageRelatedCache(batchId?: number | string, stageId?: number | string) {
  const keysToDelete: string[] = [];
  const listKeys = await redis.keys('processing-batches:list:*');
  if (listKeys.length) keysToDelete.push(...listKeys);
  if (batchId) keysToDelete.push(`processing-batch:${batchId}`);
  if (keysToDelete.length) await redis.del(...keysToDelete);
}

async function processingStageRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = (request as AuthenticatedRequest).user;
    try {
      const userId = authUser.id;
      const { processingBatchId, previousStageId, processMethod, dateOfProcessing, doneBy } =
        createProcessingStageSchema.parse(request.body);

      const batch = await prisma.processingBatch.findUnique({
        where: { id: processingBatchId },
        include: { processingStages: { orderBy: { processingCount: 'desc' }, take: 1 } },
      });

      if (!batch) return reply.status(404).send({ error: 'Processing batch not found.' });

      const latestStage = batch.processingStages[0];
      if (!latestStage) return reply.status(400).send({ error: 'No initial stage found for this batch.' });
      if (latestStage.status !== 'FINISHED') {
        return reply.status(400).send({ error: 'The latest processing stage must be FINISHED to start a new one.' });
      }
      if (previousStageId && latestStage.id !== previousStageId) {
        return reply
          .status(400)
          .send({ error: 'Mismatch: previousStageId does not correspond to the latest finished stage of the batch.' });
      }
      if (!latestStage.quantityAfterProcess || latestStage.quantityAfterProcess <= 0) {
        return reply.status(400).send({ error: 'Previous stage has no output quantity to process further.' });
      }

      const newStage = await prisma.processingStage.create({
        data: {
          processingBatchId,
          processingCount: latestStage.processingCount + 1,
          processMethod,
          dateOfProcessing,
          doneBy,
          initialQuantity: latestStage.quantityAfterProcess,
          status: 'IN_PROGRESS',
          createdById: userId,
        },
      });

      await invalidateStageRelatedCache(processingBatchId);
      return reply.status(201).send(newStage);
    } catch (error: any) {
      if (error.issues) return reply.status(400).send({ error: 'Invalid request data', details: error.issues });
      console.error('Create processing stage error:', error);
      return reply.status(500).send({ error: 'Server error creating processing stage' });
    }
  });

  fastify.put(
    '/:stageId/finalize',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // const authUser = (request as AuthenticatedRequest).user;
      try {
        const { stageId } = request.params as { stageId: string };
        const id = parseInt(stageId);
        if (isNaN(id)) return reply.status(400).send({ error: 'Invalid Stage ID' });

        const { dateOfCompletion, quantityAfterProcess } = finalizeProcessingStageSchema.parse(request.body);

        const stage = await prisma.processingStage.findUnique({ where: { id } });
        if (!stage) return reply.status(404).send({ error: 'Processing stage not found.' });
        if (stage.status === 'FINISHED') return reply.status(400).send({ error: 'Stage is already finalized.' });

        // const dryingEntryCount = await prisma.drying.count({ where: { processingStageId: id }});
        // if (dryingEntryCount === 0) { // Removed this strict check as per thought process
        //     return reply.status(400).send({ error: 'Cannot finalize stage without at least one drying data entry.' });
        // }

        const updatedStage = await prisma.processingStage.update({
          where: { id },
          data: { dateOfCompletion, quantityAfterProcess, status: 'FINISHED' },
        });

        await invalidateStageRelatedCache(updatedStage.processingBatchId, id);
        return updatedStage;
      } catch (error: any) {
        if (error.issues) return reply.status(400).send({ error: 'Invalid request data', details: error.issues });
        console.error('Finalize stage error:', error);
        return reply.status(500).send({ error: 'Server error finalizing stage' });
      }
    }
  );

  fastify.post(
    '/:stageId/drying',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // const authUser = (request as AuthenticatedRequest).user;
      try {
        const { stageId } = request.params as { stageId: string };
        const id = parseInt(stageId);
        if (isNaN(id)) return reply.status(400).send({ error: 'Invalid Stage ID' });

        const data = createDryingEntrySchema.parse({ ...(request.body as object), processingStageId: id });

        const stage = await prisma.processingStage.findUnique({ where: { id } });
        if (!stage) return reply.status(404).send({ error: 'Processing stage not found.' });
        if (stage.status !== 'IN_PROGRESS') {
          return reply.status(400).send({ error: 'Can only add drying data to IN_PROGRESS stages.' });
        }

        const existingDryingForDay = await prisma.drying.findFirst({
          where: { processingStageId: id, day: data.day },
        });
        if (existingDryingForDay) {
          return reply.status(400).send({ error: `Drying data for day ${data.day} already exists for this stage.` });
        }

        const newDryingEntry = await prisma.drying.create({ data });

        await invalidateStageRelatedCache(stage.processingBatchId, id);
        return reply.status(201).send(newDryingEntry);
      } catch (error: any) {
        if (error.issues)
          return reply.status(400).send({ error: 'Invalid request data for drying entry', details: error.issues });
        console.error('Add drying data error:', error);
        return reply.status(500).send({ error: 'Server error adding drying data' });
      }
    }
  );

  fastify.get(
    '/:stageId/drying',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // const authUser = (request as AuthenticatedRequest).user;
      try {
        const { stageId } = request.params as { stageId: string };
        const id = parseInt(stageId);
        if (isNaN(id)) return reply.status(400).send({ error: 'Invalid Stage ID' });

        const dryingEntries = await prisma.drying.findMany({
          where: { processingStageId: id },
          orderBy: { day: 'asc' },
        });
        return { dryingEntries };
      } catch (error) {
        console.error('Get drying data error:', error);
        return reply.status(500).send({ error: 'Server error fetching drying data' });
      }
    }
  );
}

export default processingStageRoutes;
