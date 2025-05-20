import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import farmerRoutes from './routes/farmer';
import fieldRoutes from './routes/fields';
import procurementRoutes from './routes/procurement';
import processingBatchRoutes from './routes/processingBatch';
import processingStageRoutes from './routes/processingStage';
import salesRoutes from './routes/sales';
import helloWorldRoutes from './routes/helloWorld';

const fastify = Fastify({
  logger: {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  },
});

async function registerPlugins() {
  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  });

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET,
  });

  await fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET,
    hook: 'onRequest',
  });
}

async function registerRoutes() {
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(userRoutes, { prefix: '/api/users' });
  fastify.register(farmerRoutes, { prefix: '/api/farmers' });
  fastify.register(fieldRoutes, { prefix: '/api/fields' });
  fastify.register(procurementRoutes, { prefix: '/api/procurements' });
  fastify.register(processingBatchRoutes, { prefix: '/api/processing-batches' });
  fastify.register(processingStageRoutes, { prefix: '/api/processing-stages' });
  fastify.register(salesRoutes, { prefix: '/api/sales' });

  fastify.register(helloWorldRoutes, { prefix: '/api' });
}

async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    // const host = process.env.HOST ?? '0.0.0.0';

    await fastify.listen({ port });
    console.log(`Server is running on ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
