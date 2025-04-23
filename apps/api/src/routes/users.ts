import type { FastifyInstance } from 'fastify';
import { prisma } from '@chaya/shared';
import { verifyAdmin, type AuthenticatedRequest } from '../middlewares/auth';
import { updateUserSchema } from '@chaya/shared';
import { hashPassword } from '../lib/password';

async function userRoutes(fastify: FastifyInstance) {
  // Get all users (admin only)
  fastify.get('/', { preHandler: verifyAdmin }, async (request, reply) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isEnabled: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return { users };
    } catch (error) {
      console.error('Get users error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  // Get user by ID (admin only)
  fastify.get('/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isEnabled: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return { user };
    } catch (error) {
      console.error('Get user error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  // Update user (admin only)
  fastify.put('/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userData = updateUserSchema.parse(request.body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingUser) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Prepare update data
      const updateData: any = {};

      if (userData.name) updateData.name = userData.name;
      if (userData.email) updateData.email = userData.email;
      if (userData.isEnabled !== undefined) updateData.isEnabled = userData.isEnabled;

      // If changing password, hash it
      if (userData.password) {
        updateData.password = await hashPassword(userData.password);
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isEnabled: true,
          isActive: true,
          lastLoginAt: true,
          updatedAt: true,
        },
      });

      return { user: updatedUser };
    } catch (error) {
      console.error('Update user error:', error);
      return reply.status(400).send({ error: 'Invalid request' });
    }
  });

  // Toggle user enabled status (admin only)
  fastify.patch('/:id/toggle-status', { preHandler: verifyAdmin }, async (request, reply) => {
    // console.log('Toggle user status request:', request.body);
    const authRequest = request as AuthenticatedRequest;
    // console.log(authRequest)
    try {
      const { id } = authRequest.params as { id: string };

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Toggle enabled status
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { isEnabled: !user.isEnabled },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isEnabled: true,
        },
      });

      return { user: updatedUser };
    } catch (error) {
      console.error('Toggle user status error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  // Delete user (admin only)
  fastify.delete('/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Prevent deleting admin users
      if (user.role === 'ADMIN') {
        return reply.status(403).send({ error: 'Cannot delete admin users' });
      }

      // Delete user
      await prisma.user.delete({
        where: { id: parseInt(id) },
      });

      return { success: true };
    } catch (error) {
      console.error('Delete user error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });
}

export default userRoutes;
