import type { APIRoute } from 'astro';
import { requireAuth, type AuthenticatedRequest } from '../../../middleware/auth';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

const songSchema = z.object({
  title: z.string().min(1).max(100),
  artist: z.string().min(1).max(100),
  genre: z.string().optional()
});

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

    // Validate metadata
    const validatedData = songSchema.parse({ title, artist, genre });

    // Validate file type
    const allowedMimeTypes = [
      'audio/mpeg',  // MP3
      'audio/wav',   // WAV
      'audio/ogg',   // OGG
      'audio/x-m4a', // M4A
      'audio/aac',   // AAC
      'video/mp4',   // MP4
      'video/x-matroska', // MKV
      'video/webm'   // WEBM
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: `Invalid file type: ${file.type}. Allowed types: MP3, WAV, OGG, M4A, AAC, MP4, MKV, WEBM` }),
        { status: 400 }
      );
    }

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
        title: validatedData.title,
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
