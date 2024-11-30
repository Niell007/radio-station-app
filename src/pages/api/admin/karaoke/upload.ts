import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../../../../middleware/auth';
import { prisma } from '../../../../lib/prisma';

const uploadSchema = z.object({
  title: z.string().min(1).max(100),
  artist: z.string().min(1).max(100),
  language: z.string().min(2).max(2),
  genre: z.string().min(1).max(50)
});

export const POST: APIRoute = async (context) => {
  const authResponse = await requireAuth(['admin'])(context);
  if (authResponse) return authResponse;

  try {
    const formData = await context.request.formData();
    const file = formData.get('file') as File;
    const lyrics = formData.get('lyrics') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 50MB limit' }),
        { status: 400 }
      );
    }

    // Validate metadata
    const metadata = {
      title: formData.get('title'),
      artist: formData.get('artist'),
      language: formData.get('language'),
      genre: formData.get('genre')
    };

    const validatedData = uploadSchema.parse(metadata);

    // Upload file to R2
    const bucket = context.locals.runtime.env.BUCKET;
    const fileKey = `karaoke/${Date.now()}-${file.name}`;
    await bucket.put(fileKey, file, {
      httpMetadata: {
        contentType: file.type
      }
    });

    // Upload lyrics file if provided
    let lyricsKey = null;
    if (lyrics) {
      lyricsKey = `karaoke/lyrics/${Date.now()}-${lyrics.name}`;
      await bucket.put(lyricsKey, lyrics, {
        httpMetadata: {
          contentType: 'text/plain'
        }
      });
    }

    // Create database record
    const karaokeFile = await prisma.karaokeFile.create({
      data: {
        title: validatedData.title,
        artist: validatedData.artist,
        language: validatedData.language,
        genre: validatedData.genre,
        fileUrl: `https://${context.request.headers.get('host')}/api/karaoke/${fileKey}`,
        lyricsUrl: lyricsKey ? `https://${context.request.headers.get('host')}/api/karaoke/${lyricsKey}` : null,
        fileSize: file.size,
        mimeType: file.type,
        duration: 0 // This should be calculated from the audio file
      }
    });

    return new Response(
      JSON.stringify(karaokeFile),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading karaoke file:', error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input data', details: error.errors }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Failed to upload file' }),
      { status: 500 }
    );
  }
}; 