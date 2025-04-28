import type { FastifyInstance } from 'fastify';
import { prisma } from '@chaya/shared';
import { authenticate } from '../middlewares/auth';
import { createProcurementSchema } from '@chaya/shared';
import { generateBatchCode } from '../helper';
import { Prisma } from '@prisma/client';

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
      const {
        search: rawSearch = '',
        page: rawPage = '1',
        limit: rawLimit = '10',
      } = request.query as Record<string, string>;

      const search = rawSearch;
      const page = parseInt(rawPage, 10) || 1;
      const limit = parseInt(rawLimit, 10) || 10;
      const skip = (page - 1) * limit;

      const where: Prisma.ProcurementWhereInput = search
        ? {
            OR: [
              { batchCode: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              { crop: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              { procuredBy: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            ],
          }
        : {};

      const [procurements, totalCount] = await Promise.all([
        prisma.procurement.findMany({
          where,
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
          skip,
          take: limit,
        }),
        prisma.procurement.count({ where }),
      ]);

      return {
        procurements,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error('Get procurements error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const procurement = await prisma.procurement.findUnique({
        where: { id: parseInt(id) },
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
      });

      if (!procurement) {
        return reply.status(404).send({ error: 'Procurement not found' });
      }

      return { procurement };
    } catch (error) {
      console.error('Get procurement error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.put('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = createProcurementSchema.parse(request.body);

      const procurement = await prisma.procurement.findUnique({
        where: { id: parseInt(id) },
      });

      if (!procurement) {
        return reply.status(404).send({ error: 'Procurement not found' });
      }

      const combinedDateTime = new Date(`${data.date.toISOString().split('T')[0]}T${data.time}`);
      if (isNaN(combinedDateTime.getTime())) {
        return reply.status(400).send({ error: 'Invalid date or time combination' });
      }

      const updatedProcurement = await prisma.procurement.update({
        where: { id: parseInt(id) },
        data: {
          farmerId: data.farmerId,
          crop: data.crop,
          procuredForm: data.procuredForm,
          speciality: data.speciality,
          quantity: data.quantity,
          date: data.date,
          time: combinedDateTime,
          lotNo: data.lotNo,
          procuredBy: data.procuredBy,
          vehicleNo: data.vehicleNo,
        },
      });

      return { procurement: updatedProcurement };
    } catch (error) {
      console.error('Update procurement error:', error);
      return reply.status(400).send({ error: 'Invalid request data' });
    }
  });

  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const procurement = await prisma.procurement.findUnique({
        where: { id: parseInt(id) },
      });

      if (!procurement) {
        return reply.status(404).send({ error: 'Procurement not found' });
      }

      await prisma.procurement.delete({
        where: { id: parseInt(id) },
      });

      return { success: true };
    } catch (error) {
      console.error('Delete procurement error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.delete('/bulk', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { ids } = request.body as { ids: number[] };

      if (!Array.isArray(ids) || ids.length === 0) {
        return reply.status(400).send({ error: 'Invalid or empty list of IDs' });
      }

      await prisma.procurement.deleteMany({
        where: { id: { in: ids } },
      });

      return { success: true };
    } catch (error) {
      console.error('Bulk delete procurements error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });
}

export default procurementRoutes;
