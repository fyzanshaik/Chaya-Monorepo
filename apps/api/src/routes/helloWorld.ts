import type { FastifyInstance } from 'fastify';
import { prisma } from '@chaya/shared';
import redisClient from '../lib/upstash-redis';
const createPing = async () => {
  const ping = await prisma.ping.create({
    data: {},
  });
  console.log('Created Ping:', ping);
  redisClient.set('ping', JSON.stringify(ping));
  const cached = await redisClient.get('ping');
  console.log('Cached Ping:', cached);
  return { ping, cached };
};

async function helloWorldRoutes(fastify: FastifyInstance) {
  fastify.get('/hello', async (request, reply) => {
    const data = await createPing();
    if (data.ping && data.cached) {
      return { ping: data.ping, cached: data.cached, message: 'Redis and DB are working' };
    } else if (data.ping) {
      return { ping: data.ping, cached: data.cached, message: 'DB is working but Redis is not working' };
    } else if (data.cached) {
      return { ping: data.ping, cached: data.cached, message: 'Redis is working but DB is not working' };
    }
    return reply.status(500).send({ error: 'Server error' });
  });
}

export default helloWorldRoutes;
