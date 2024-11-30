import type { APIRoute } from 'astro';
import { requireAuth } from '../../../middleware/auth';

export const GET: APIRoute = async (context) => {
  const authResponse = await requireAuth()(context);
  if (authResponse) return authResponse;

  try {
    const songId = context.params.id;
    if (!songId) {
      return new Response(
        JSON.stringify({ message: 'Song ID is required' }),
        { status: 400 }
      );
    }

    const db = context.locals.runtime.env.DB;
    const song = await db
      .prepare(`
        SELECT id, title, artist, genre, file_url, duration
        FROM songs
        WHERE id = ?
      `)
      .bind(songId)
      .first();

    if (!song) {
      return new Response(
        JSON.stringify({ message: 'Song not found' }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(song), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching song:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}; 