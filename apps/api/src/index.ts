import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { createRouteHandler } from 'uploadthing/fastify';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import farmerRoutes from './routes/farmer';
import fieldRoutes from './routes/fields';
import helloWorldRoutes from './routes/helloWorld';
const fastify = Fastify({
	logger: {
		level: 'debug',

		transport: {
			target: 'pino-pretty',
			options: {
				colorize: true, // Adds color to the logs
				translateTime: 'SYS:standard', // Formats the timestamp
				ignore: 'pid,hostname', // Removes unnecessary fields
			},
		},
	},
});

async function registerPlugins() {
	await fastify.register(cors, {
		origin: process.env.FRONTEND_URL || 'http://localhost:3000',
		credentials: true,
	});

	await fastify.register(jwt, {
		secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
	});

	await fastify.register(cookie, {
		secret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
		hook: 'onRequest',
	});
}

async function registerRoutes() {
	fastify.register(authRoutes, { prefix: '/api/auth' });
	fastify.register(userRoutes, { prefix: '/api/users' });
	fastify.register(farmerRoutes, { prefix: '/api/farmers' });
	fastify.register(fieldRoutes, { prefix: '/api/fields' });
	fastify.register(helloWorldRoutes, { prefix: '/api' });
}

async function start() {
	try {
		await registerPlugins();
		await registerRoutes();

		const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
		const host = process.env.HOST || '0.0.0.0';

		await fastify.listen({ port, host });
		console.log(`Server is running on ${host}:${port}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

start();
