import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../../../middleware/auth';
import { prisma } from '../../../lib/prisma';

const showUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  daysOfWeek: z.string().optional()
});

export const GET: APIRoute = async (context) => {
  const authResponse = await requireAuth()(context);
  if (authResponse) return authResponse;

  const { id } = context.params;
  if (!id || isNaN(Number(id))) {
    return new Response(
      JSON.stringify({ error: 'Invalid show ID' }),
      { status: 400 }
    );
  }

  try {
    const show = await prisma.show.findUnique({
      where: { id: Number(id) },
      include: {
        host: {
          select: {
            username: true
          }
        }
      }
    });

    if (!show) {
      return new Response(
        JSON.stringify({ error: 'Show not found' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify(show),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching show:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch show' }),
      { status: 500 }
    );
  }
};

export const PUT: APIRoute = async (context) => {
  const authResponse = await requireAuth()(context);
  if (authResponse) return authResponse;

  const { id } = context.params;
  if (!id || isNaN(Number(id))) {
    return new Response(
      JSON.stringify({ error: 'Invalid show ID' }),
      { status: 400 }
    );
  }

  try {
    const body = await context.request.json();
    const updates = showUpdateSchema.parse(body);
    const user = (context.request as AuthenticatedRequest).user!;

    // Check if user is authorized to update this show
    const show = await prisma.show.findUnique({
      where: { id: Number(id) }
    });

    if (!show) {
      return new Response(
        JSON.stringify({ error: 'Show not found' }),
        { status: 404 }
      );
    }

    if (show.hostId !== user.id && user.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Not authorized to update this show' }),
        { status: 403 }
      );
    }

    const updatedShow = await prisma.show.update({
      where: { id: Number(id) },
      data: updates,
      include: {
        host: {
          select: {
            username: true
          }
        }
      }
    });

    return new Response(
      JSON.stringify(updatedShow),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating show:', error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input data', details: error.errors }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Failed to update show' }),
      { status: 500 }
    );
  }
};

export const DELETE: APIRoute = async (context) => {
  const authResponse = await requireAuth()(context);
  if (authResponse) return authResponse;

  const { id } = context.params;
  if (!id || isNaN(Number(id))) {
    return new Response(
      JSON.stringify({ error: 'Invalid show ID' }),
      { status: 400 }
    );
  }

  try {
    const user = (context.request as AuthenticatedRequest).user!;

    // Check if user is authorized to delete this show
    const show = await prisma.show.findUnique({
      where: { id: Number(id) }
    });

    if (!show) {
      return new Response(
        JSON.stringify({ error: 'Show not found' }),
        { status: 404 }
      );
    }

    if (show.hostId !== user.id && user.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Not authorized to delete this show' }),
        { status: 403 }
      );
    }

    await prisma.show.delete({
      where: { id: Number(id) }
    });

    return new Response(
      JSON.stringify({ message: 'Show deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting show:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete show' }),
      { status: 500 }
    );
  }
}; 