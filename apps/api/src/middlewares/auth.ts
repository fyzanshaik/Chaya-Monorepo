import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@chaya/shared';

export interface JWTPayload {
	id: number;
	role: 'ADMIN' | 'STAFF';
	iat: number;
	exp: number;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
	try {
		console.log('Authenticating request...');

		// Log cookies to check if the token is present
		console.log('Request cookies:', request.cookies);

		const token = request.cookies.token;

		if (!token) {
			console.log('No token found in cookies');
			return reply.status(401).send({ error: 'Authentication required' });
		}

		// Log the token for debugging
		console.log('Token found:', token);

		// Verify the token
		const decoded = request.server.jwt.verify<JWTPayload>(token);
		console.log('Decoded JWT payload:', decoded);

		// Check if the user exists and is enabled
		const user = await prisma.user.findUnique({
			where: {
				id: decoded.id,
				isEnabled: true,
			},
		});

		// Log the user object or null if not found
		console.log('User found in database:', user);

		if (!user) {
			console.log('User not found or disabled');
			return reply.status(401).send({ error: 'User not found or disabled' });
		}

		// Attach the decoded JWT payload to the request
		(request as any).user = decoded;
		console.log('Authentication successful. User attached to request:', decoded);
	} catch (error) {
		// Log the error for debugging
		console.error('Authentication error:', error);
		return reply.status(401).send({ error: 'Invalid or expired token' });
	}
}

export async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
	try {
		console.log('Verifying admin access...');

		// Call the authenticate function
		await authenticate(request, reply);

		// Log the user object attached to the request
		const user = (request as any).user as JWTPayload;
		console.log('Authenticated user:', user);

		// Check if the user has the ADMIN role
		if (user.role !== 'ADMIN') {
			console.log('User is not an admin. Role:', user.role);
			return reply.status(403).send({ error: 'Admin access required' });
		}

		console.log('Admin access verified');
	} catch (error) {
		// Log the error for debugging
		console.error('Admin verification error:', error);
		return reply.status(403).send({ error: 'Admin access required' });
	}
}

export interface AuthenticatedRequest extends FastifyRequest {
	user: JWTPayload;
}
