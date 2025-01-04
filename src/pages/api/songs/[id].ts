import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';
import { createCipheriv, randomBytes } from 'crypto';

const songSchema = z.object({
  title: z.string().min(1).max(100),
  artist: z.string().min(1).max(100),
  genre: z.string().optional()
});

const algorithm = 'aes-256-ctr';
const secretKey = process.env.SECRET_KEY || 'your-secret-key';

function encrypt(text: string) {
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export const PUT: APIRoute = async ({ request, params }) => {
  try {
    const id = parseInt(params.id as string);
    if (isNaN(id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid song ID' }),
        { status: 400 }
      );
    }

    const data = await request.json();
    const validatedData = songSchema.parse(data);

    const song = await prisma.song.findUnique({
      where: { id }
    });

    if (!song) {
      return new Response(
        JSON.stringify({ error: 'Song not found' }),
        { status: 404 }
      );
    }

    const encryptedTitle = encrypt(validatedData.title);

    const updatedSong = await prisma.song.update({
      where: { id },
      data: {
        title: encryptedTitle,
        artist: validatedData.artist,
        genre: validatedData.genre || null
      }
    });

    return new Response(
      JSON.stringify(updatedSong),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating song:', error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input data', details: error.errors }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Failed to update song' }),
      { status: 500 }
    );
  }
};
