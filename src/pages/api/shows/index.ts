import type { APIRoute } from 'astro';
import { requireAuth, type AuthenticatedRequest } from '../../../middleware/auth';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

const showSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  daysOfWeek: z.string()
});

export const GET: APIRoute = async (context) => {
  const authResponse = await requireAuth()(context);
  if (authResponse) return authResponse;

  try {
    const shows = await prisma.show.findMany({
      include: {
        host: {
          select: {
            username: true
          }
        }
      }
    });

    return new Response(
      JSON.stringify(shows),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching shows:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch shows' }),
      { status: 500 }
    );
  }
};

export const POST: APIRoute = async (context) => {
  const authResponse = await requireAuth()(context);
  if (authResponse) return authResponse;

  try {
    const body = await context.request.json();
    const { title, description, startTime, endTime, daysOfWeek } = showSchema.parse(body);
    const user = (context.request as AuthenticatedRequest).user!;

    const show = await prisma.show.create({
      data: {
        title,
        description,
        startTime,
        endTime,
        daysOfWeek,
        hostId: user.id
      },
      include: {
        host: {
          select: {
            username: true
          }
        }
      }
    });

    return new Response(
      JSON.stringify(show),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating show:', error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input data', details: error.errors }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Failed to create show' }),
      { status: 500 }
    );
  }
}; 