import type { FastifyInstance } from 'fastify';
import { prisma } from '@chaya/shared';
import { authenticate } from '../middlewares/auth';
import { createDryingSchema } from '@chaya/shared';

async function processingRoutes(fastify: FastifyInstance) {
  // GET /api/processing
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const {
        query: rawQuery = '',
        page: rawPage = '1',
        limit: rawLimit = '10',
      } = request.query as Record<string, string>;

      // parse
      const query = rawQuery;
      const page = parseInt(rawPage, 10) || 1;
      const limit = parseInt(rawLimit, 10) || 10;
      const skip = (page - 1) * limit;

      const procurementWhere = {
        OR: [{ batchCode: { contains: query } }, { crop: { contains: query } }],
      };

      const [procurements, totalCount] = await Promise.all([
        prisma.procurement.findMany({
          where: procurementWhere,
          include: {
            processing: {
              include: { drying: true },
              orderBy: { createdAt: 'desc' },
              take: 1, // we only need the latest processing, if any
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.procurement.count({ where: procurementWhere }),
      ]);

      const processingRecords = procurements.map(pr => {
        const procArr = pr.processing;
        if (procArr.length > 0) {
          const proc = procArr[0];
          return {
            id: proc.id,
            procurementId: pr.id,
            lotNo: pr.lotNo,
            batchNo: proc.batchNo,
            crop: pr.crop,
            procuredForm: pr.procuredForm,
            quantity: pr.quantity,
            speciality: pr.speciality,
            processMethod: proc.processMethod,
            dateOfProcessing: proc.dateOfProcessing,
            dateOfCompletion: proc.dateOfCompletion,
            quantityAfterProcess: proc.quantityAfterProcess,
            doneBy: proc.doneBy,
            status: proc.status,
            drying: proc.drying,
            processingCount: proc.processingCount,
            procurement: {
              batchCode: pr.batchCode,
              crop: pr.crop,
              quantity: pr.quantity,
              speciality: pr.speciality,
              procuredForm: pr.procuredForm,
              lotNo: pr.lotNo,
            },
          };
        } else {
          // no processing yet
          return {
            id: null,
            procurementId: pr.id,
            lotNo: pr.lotNo,
            batchNo: pr.batchCode,
            crop: pr.crop,
            procuredForm: pr.procuredForm,
            quantity: pr.quantity,
            speciality: pr.speciality,
            processMethod: null,
            dateOfProcessing: null,
            dateOfCompletion: null,
            quantityAfterProcess: null,
            doneBy: null,
            status: 'NOT_STARTED',
            drying: [],
            processingCount: 0,
            procurement: {
              batchCode: pr.batchCode,
              crop: pr.crop,
              quantity: pr.quantity,
              speciality: pr.speciality,
              procuredForm: pr.procuredForm,
              lotNo: pr.lotNo,
            },
          };
        }
      });

      return {
        processingRecords,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      fastify.log.error('Get processing records error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  // POST /api/processing
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const body = request.body as any;
      const {
        procurementId,
        processMethod,
        dateOfProcessing,
        doneBy,
        dryingDays = [],
        finalAction,
        quantityAfterProcess,
        dateOfCompletion,
      } = body;

      if (!procurementId) {
        return reply.status(400).send({ error: 'procurementId is required' });
      }

      const procurement = await prisma.procurement.findUnique({
        where: { id: procurementId },
      });
      if (!procurement) {
        return reply.status(404).send({ error: 'Procurement not found' });
      }

      // Check if processing already exists
      const existingProcessing = await prisma.processing.findFirst({
        where: { procurementId },
        orderBy: { createdAt: 'desc' },
      });

      let processingCount = 1;
      let batchNo = `${procurement.batchCode}-P1`;

      if (existingProcessing) {
        processingCount = existingProcessing.processingCount + 1;
        batchNo = `${procurement.batchCode}-P${processingCount}`;
      }

      // Create processing record
      const processing = await prisma.processing.create({
        data: {
          procurementId,
          lotNo: procurement.lotNo,
          batchNo,
          crop: procurement.crop,
          procuredForm: procurement.procuredForm,
          quantity: procurement.quantity,
          speciality: procurement.speciality,
          processMethod,
          dateOfProcessing: new Date(dateOfProcessing),
          doneBy,
          status: finalAction === 'selling' ? 'FINISHED' : 'IN_PROGRESS',
          processingCount,
          quantityAfterProcess: quantityAfterProcess || null,
          dateOfCompletion: dateOfCompletion ? new Date(dateOfCompletion) : null,
        },
      });

      // Add drying days if provided
      if (dryingDays.length > 0) {
        for (const day of dryingDays) {
          await prisma.drying.create({
            data: {
              processingId: processing.id,
              day: day.day,
              temperature: day.temperature,
              humidity: day.humidity,
              pH: day.pH,
              moistureQuantity: day.moistureQuantity,
            },
          });
        }
      }

      return { processing };
    } catch (error) {
      fastify.log.error('Create processing error:', error);
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });

  // POST /api/processing/:id/drying
  fastify.post('/:id/drying', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;
      const data = {
        processingId: Number(id),
        day: body.day,
        temperature: body.temperature,
        humidity: body.humidity,
        pH: body.pH,
        moistureQuantity: body.moistureQuantity,
      };
      createDryingSchema.parse(data);

      const proc = await prisma.processing.findUnique({
        where: { id: Number(id) },
      });
      if (!proc) {
        return reply.status(404).send({ error: 'Processing not found' });
      }
      if (proc.status !== 'IN_PROGRESS') {
        return reply.status(400).send({ error: 'Processing is not in progress' });
      }

      const dup = await prisma.drying.findFirst({
        where: {
          processingId: Number(id),
          day: data.day,
        },
      });
      if (dup) {
        return reply.status(400).send({ error: 'Drying data already exists for this day' });
      }

      const drying = await prisma.drying.create({
        data: { ...data },
      });
      return { drying };
    } catch (error) {
      fastify.log.error('Create drying error:', error);
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });

  // POST /api/processing/:id/complete
  fastify.post('/:id/complete', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { action, quantityAfterProcess } = request.body as {
        action: 'sell' | 'continue';
        quantityAfterProcess: number;
      };

      const proc = await prisma.processing.findUnique({
        where: { id: Number(id) },
      });
      if (!proc) {
        return reply.status(404).send({ error: 'Processing not found' });
      }

      const updated = await prisma.processing.update({
        where: { id: Number(id) },
        data: {
          status: action === 'sell' ? 'FINISHED' : 'IN_PROGRESS',
          dateOfCompletion: action === 'sell' ? new Date() : null,
          quantityAfterProcess,
          processingCount: action === 'continue' ? { increment: 1 } : proc.processingCount,
        },
      });

      return { processing: updated };
    } catch (error) {
      fastify.log.error('Complete processing error:', error);
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });

  // GET /api/processing/:id/drying
  fastify.get('/:id/drying', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const days = await prisma.drying.findMany({
        where: { processingId: Number(id) },
        orderBy: { day: 'asc' },
      });
      return { dryingDays: days };
    } catch (error) {
      fastify.log.error('Get drying days error:', error);
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });
}

export default processingRoutes;
