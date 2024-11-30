import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../middleware/auth';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

const editSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  artist: z.string().min(1).max(100).optional(),
  language: z.string().min(2).max(2).optional(),
  genre: z.string().min(1).max(50).optional()
});

export const PUT: APIRoute = async (context) => {
  const authResponse = await requireAuth(['admin'])(context);
  if (authResponse) return authResponse;

  const { id } = context.params;
  if (!id || isNaN(Number(id))) {
    return new Response(
      JSON.stringify({ error: 'Invalid karaoke file ID' }),
      { status: 400 }
    );
  }

  try {
    const body = await context.request.json();
    const updates = editSchema.parse(body);

    const karaokeFile = await prisma.karaokeFile.update({
      where: { id: Number(id) },
      data: updates
    });

    return new Response(
      JSON.stringify(karaokeFile),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating karaoke file:', error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input data', details: error.errors }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Failed to update karaoke file' }),
      { status: 500 }
    );
  }
};

export const DELETE: APIRoute = async (context) => {
  const authResponse = await requireAuth(['admin'])(context);
  if (authResponse) return authResponse;

  const { id } = context.params;
  if (!id || isNaN(Number(id))) {
    return new Response(
      JSON.stringify({ error: 'Invalid karaoke file ID' }),
      { status: 400 }
    );
  }

  try {
    // Get file info first
    const karaokeFile = await prisma.karaokeFile.findUnique({
      where: { id: Number(id) }
    });

    if (!karaokeFile) {
      return new Response(
        JSON.stringify({ error: 'Karaoke file not found' }),
        { status: 404 }
      );
    }

    // Delete from R2
    const bucket = context.locals.runtime.env.BUCKET;
    const fileKey = new URL(karaokeFile.fileUrl).pathname.split('/').pop();
    if (fileKey) {
      await bucket.delete(fileKey);
    }

    // Delete lyrics file if exists
    if (karaokeFile.lyricsUrl) {
      const lyricsKey = new URL(karaokeFile.lyricsUrl).pathname.split('/').pop();
      if (lyricsKey) {
        await bucket.delete(lyricsKey);
      }
    }

    // Delete from database
    await prisma.karaokeFile.delete({
      where: { id: Number(id) }
    });

    return new Response(
      JSON.stringify({ message: 'Karaoke file deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting karaoke file:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete karaoke file' }),
      { status: 500 }
    );
  }
}; 