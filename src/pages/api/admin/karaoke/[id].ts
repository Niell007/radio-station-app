import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '../../../../../lib/prisma';

const updateKaraokeFileSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  language: z.string().min(2).max(2),
  genre: z.string().optional(),
  file_url: z.string().url(),
  lyrics_url: z.string().url().optional(),
  duration: z.number().positive(),
  file_size: z.number().positive(),
  mime_type: z.string(),
  difficulty: z.number().min(1).max(5).optional(),
  is_explicit: z.boolean().optional()
});

export const PUT: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), { status: 400 });
  }

  try {
    const data = await request.json();
    const validatedData = updateKaraokeFileSchema.parse(data);

    const updatedFile = await prisma.karaokeFile.update({
      where: { id },
      data: validatedData
    });

    return new Response(JSON.stringify(updatedFile), { status: 200 });
  } catch (error) {
    console.error('Error updating karaoke file:', error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: error.errors }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
