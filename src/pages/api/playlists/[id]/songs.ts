import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../../../../middleware/auth';
import { prisma } from '../../../../lib/prisma';

const songSchema = z.object({
  songId: z.number().int().positive(),
  position: z.number().int().min(0)
});

export const GET: APIRoute = async (context) => {
  const authResponse = await requireAuth()(context);
  if (authResponse) return authResponse;

  const { id } = context.params;
  if (!id || isNaN(Number(id))) {
    return new Response(
      JSON.stringify({ error: 'Invalid playlist ID' }),
      { status: 400 }
    );
  }

  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: Number(id) },
      include: {
        songs: {
          include: {
            song: true
          },
          orderBy: {
            position: 'asc'
          }
        }
      }
    });

    if (!playlist) {
      return new Response(
        JSON.stringify({ error: 'Playlist not found' }),
        { status: 404 }
      );
    }

    // Check if user has access to this playlist
    const user = (context.request as AuthenticatedRequest).user!;
    if (!playlist.isPublic && playlist.userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to view this playlist' }),
        { status: 403 }
      );
    }

    return new Response(
      JSON.stringify(playlist.songs.map(playlistSong => ({
        ...playlistSong.song,
        position: playlistSong.position
      }))),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching playlist songs:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch playlist songs' }),
      { status: 500 }
    );
  }
};

export const POST: APIRoute = async (context) => {
  const authResponse = await requireAuth()(context);
  if (authResponse) return authResponse;

  const { id: playlistId } = context.params;
  if (!playlistId || isNaN(Number(playlistId))) {
    return new Response(
      JSON.stringify({ error: 'Invalid playlist ID' }),
      { status: 400 }
    );
  }

  try {
    const body = await context.request.json();
    const { songId, position } = songSchema.parse(body);
    const user = (context.request as AuthenticatedRequest).user!;

    // Check if playlist exists and user owns it
    const playlist = await prisma.playlist.findUnique({
      where: { id: Number(playlistId) }
    });

    if (!playlist) {
      return new Response(
        JSON.stringify({ error: 'Playlist not found' }),
        { status: 404 }
      );
    }

    if (playlist.userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to modify this playlist' }),
        { status: 403 }
      );
    }

    // Add song to playlist
    const playlistSong = await prisma.playlistSong.create({
      data: {
        playlistId: Number(playlistId),
        songId,
        position
      },
      include: {
        song: true
      }
    });

    return new Response(
      JSON.stringify({
        ...playlistSong.song,
        position: playlistSong.position
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input data', details: error.errors }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Failed to add song to playlist' }),
      { status: 500 }
    );
  }
};

export const DELETE: APIRoute = async (context) => {
  const authResponse = await requireAuth()(context);
  if (authResponse) return authResponse;

  const { id: playlistId } = context.params;
  const songId = context.url.searchParams.get('songId');

  if (!playlistId || isNaN(Number(playlistId)) || !songId || isNaN(Number(songId))) {
    return new Response(
      JSON.stringify({ error: 'Invalid playlist or song ID' }),
      { status: 400 }
    );
  }

  try {
    const user = (context.request as AuthenticatedRequest).user!;

    // Check if playlist exists and user owns it
    const playlist = await prisma.playlist.findUnique({
      where: { id: Number(playlistId) }
    });

    if (!playlist) {
      return new Response(
        JSON.stringify({ error: 'Playlist not found' }),
        { status: 404 }
      );
    }

    if (playlist.userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to modify this playlist' }),
        { status: 403 }
      );
    }

    // Remove song from playlist
    await prisma.playlistSong.delete({
      where: {
        playlistId_songId: {
          playlistId: Number(playlistId),
          songId: Number(songId)
        }
      }
    });

    return new Response(
      JSON.stringify({ message: 'Song removed from playlist' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to remove song from playlist' }),
      { status: 500 }
    );
  }
}; 