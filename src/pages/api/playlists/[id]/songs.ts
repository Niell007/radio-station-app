import type { APIRoute } from 'astro';
import { requireAuth, type AuthenticatedRequest } from '../../../../middleware/auth';
import { z } from 'zod';
import { createCipheriv, randomBytes } from 'crypto';

const songSchema = z.object({
  songId: z.number().int().positive()
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

  const user = (context.request as AuthenticatedRequest).user!;

  try {
    const data = await context.request.json();
    const validatedData = songSchema.safeParse(data);

    if (!validatedData.success) {
      return new Response(
        JSON.stringify({ 
          message: 'Invalid input',
          errors: validatedData.error.errors 
        }),
        { status: 400 }
      );
    }

    if (!validatedData.data.songId) {
      return new Response(
        JSON.stringify({ message: 'Song ID is required' }),
        { status: 400 }
      );
    }

    // Encrypt song ID
    const encryptedSongId = encrypt(validatedData.data.songId.toString());

    // Add song to playlist
    const db = context.locals.runtime.env.DB;
    const result = await db
      .prepare(`
        INSERT INTO playlist_songs (
          playlist_id, song_id, added_at
        ) VALUES (?, ?, CURRENT_TIMESTAMP)
      `)
      .bind(
        context.params.id,
        encryptedSongId
      )
      .run();

    if (!result.success) {
      throw new Error('Failed to add song to playlist');
    }

    return new Response(
      JSON.stringify({ 
        message: 'Song added to playlist successfully'
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
};
