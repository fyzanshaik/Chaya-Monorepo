import type { FastifyInstance } from 'fastify';
import { prisma } from '@chaya/shared';
import { authenticate } from '../middlewares/auth';
import { createProcurementSchema } from '@chaya/shared';
import { generateBatchCode } from '../helper';

async function procurementRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { farmerId, crop, procuredForm, speciality, quantity, date, time, lotNo, procuredBy, vehicleNo } =
        createProcurementSchema.parse(request.body);

      const combinedDateTime = new Date(`${date.toISOString().split('T')[0]}T${time}`);
      if (isNaN(combinedDateTime.getTime())) {
        return reply.status(400).send({ error: 'Invalid date or time combination' });
      }

      const batchCode = generateBatchCode(crop, date, lotNo);

      const existingBatch = await prisma.procurement.findUnique({
        where: { batchCode },
      });

      if (existingBatch) {
        return reply.status(400).send({ error: 'Batch code already exists' });
      }

      const procurement = await prisma.procurement.create({
        data: {
          farmerId,
          crop,
          procuredForm,
          speciality,
          quantity,
          batchCode,
          date,
          time: combinedDateTime,
          lotNo,
          procuredBy,
          vehicleNo,
        },
      });

      return { procurement };
    } catch (error) {
      console.error('Create procurement error:', error);
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });

  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const procurements = await prisma.procurement.findMany({
        include: {
          farmer: {
            select: {
              name: true,
              village: true,
              panchayath: true,
              mandal: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { procurements };
    } catch (error) {
      console.error('Get procurements error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });
}

export default procurementRoutes;
