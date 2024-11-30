import type { APIRoute } from 'astro';
import { requireAuth, type AuthenticatedRequest } from '../../../middleware/auth';
import { z } from 'zod';

interface Playlist {
  id: number;
  title: string;
  description: string | null;
  user_id: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  creator_name: string;
  song_count: number;
}

const playlistSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  is_public: z.boolean().optional()
});

// Get all playlists (public ones and user's private ones)
export const GET: APIRoute = async (context) => {
  const authResponse = await requireAuth()(context);
  if (authResponse) return authResponse;

  const user = (context.request as AuthenticatedRequest).user!;

  const db = context.locals.runtime.env.DB;
  const playlists = await db
    .prepare(`
      SELECT p.*, u.username as creator_name,
      (SELECT COUNT(*) FROM playlist_songs WHERE playlist_id = p.id) as song_count
      FROM playlists p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_public = true OR p.user_id = ?
      ORDER BY p.created_at DESC
    `)
    .bind(user.id)
    .all<Playlist>();

  return new Response(
    JSON.stringify(playlists.results),
    { status: 200 }
  );
};

// Create new playlist
export const POST: APIRoute = async (context) => {
  const authResponse = await requireAuth()(context);
  if (authResponse) return authResponse;

  const user = (context.request as AuthenticatedRequest).user!;

  try {
    const data = await context.request.json();
    const validatedData = playlistSchema.safeParse(data);

    if (!validatedData.success) {
      return new Response(
        JSON.stringify({ 
          message: 'Invalid input',
          errors: validatedData.error.errors 
        }),
        { status: 400 }
      );
    }

    // Create playlist
    const db = context.locals.runtime.env.DB;
    const result = await db
      .prepare(`
        INSERT INTO playlists (
          title, description, user_id, is_public,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      .bind(
        validatedData.data.title,
        validatedData.data.description || null,
        user.id,
        validatedData.data.is_public || false
      )
      .run();

    const playlistId = result.lastRowId;
    if (!playlistId) {
      throw new Error('Failed to create playlist');
    }

    return new Response(
      JSON.stringify({ 
        message: 'Playlist created successfully',
        playlistId
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating playlist:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}; 