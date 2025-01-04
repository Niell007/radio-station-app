import type { APIRoute } from 'astro';
import { requireAuth, type AuthenticatedRequest } from '../../../middleware/auth';
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

export const POST: APIRoute = async (context) => {
  const authResponse = await requireAuth()(context);
  if (authResponse) return authResponse;

  try {
    const formData = await context.request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    const genre = formData.get('genre') as string | null;

    if (!file || !title || !artist) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Validate file type
    const allowedFileTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'];
    if (!allowedFileTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type' }),
        { status: 400 }
      );
    }

    // Validate file size
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      return new Response(
        JSON.stringify({ error: 'File too large' }),
        { status: 400 }
      );
    }

    // Validate metadata
    const validatedData = songSchema.parse({ title, artist, genre });

    // Encrypt song title
    const encryptedTitle = encrypt(validatedData.title);

    // Upload file to R2
    const bucket = context.locals.runtime.env.BUCKET;
    const fileKey = `songs/${Date.now()}-${file.name}`;
    await bucket.put(fileKey, file, {
      httpMetadata: {
        contentType: file.type
      }
    });

    // Get file URL
    const fileUrl = `https://${context.request.headers.get('host')}/api/songs/${fileKey}`;

    // Create song record
    const song = await prisma.song.create({
      data: {
        title: encryptedTitle,
        artist: validatedData.artist,
        genre: validatedData.genre || null,
        fileUrl,
        duration: 0, // This should be calculated from the audio file
        fileSize: file.size,
        mimeType: file.type
      }
    });

    return new Response(
      JSON.stringify(song),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading song:', error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input data', details: error.errors }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Failed to upload song' }),
      { status: 500 }
    );
  }
};
