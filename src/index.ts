import { Ai } from '@cloudflare/ai';
import { 
  D1Database,
  R2Bucket,
  ExecutionContext
} from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  AI: Ai;
  MUSIC_STORAGE: R2Bucket;
  COVER_ART_STORAGE: R2Bucket;
  USER_CONTENT_STORAGE: R2Bucket;
}

interface ErrorResponse {
  error: string;
  status: number;
}

interface SongUploadData {
  file: File;
  title: string;
  artist: string;
  genre?: string;
}

interface CoverArtUploadData {
  file: File;
  songId: string;
}

interface Song {
  id: number;
  title: string;
  artist: string;
  genre?: string;
  file_url: string;
  cover_art_url?: string;
  duration?: number;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

interface PlaylistData {
  name: string;
  description?: string;
  is_public?: boolean;
}

interface FavoriteData {
  songId: number;
}

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/flac'
];

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5MB

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      
      // Basic routing
      switch (url.pathname) {
        case '/api/search':
          return await handleSearch(request, env);
        case '/api/songs':
          return await handleSongs(request, env);
        case '/api/upload/song':
          return await handleSongUpload(request, env);
        case '/api/upload/cover':
          return await handleCoverArtUpload(request, env);
        case '/api/playlists':
          return await handlePlaylists(request, env);
        case '/api/favorites':
          return await handleFavorites(request, env);
        default:
          return createErrorResponse('Not Found', 404);
      }
    } catch (error) {
      console.error('Unhandled error:', error);
      return createErrorResponse('Internal Server Error', 500);
    }
  }
};

function createErrorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message, status }),
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

async function validateFormFile(formData: FormData, fieldName: string): Promise<File | null> {
  const formFile = formData.get(fieldName);
  if (!formFile || typeof formFile === 'string') {
    return null;
  }
  return formFile as File;
}

async function parseSongUploadData(formData: FormData): Promise<SongUploadData | null> {
  const file = await validateFormFile(formData, 'file');
  const title = formData.get('title');
  const artist = formData.get('artist');
  const genre = formData.get('genre');

  if (!file || typeof title !== 'string' || typeof artist !== 'string') {
    return null;
  }

  if (!validateFileType(file, ALLOWED_AUDIO_TYPES)) {
    throw new Error('Invalid audio file type');
  }

  if (!validateFileSize(file, MAX_AUDIO_SIZE)) {
    throw new Error('Audio file too large');
  }

  return {
    file,
    title,
    artist,
    genre: typeof genre === 'string' ? genre : undefined
  };
}

async function parseCoverArtUploadData(formData: FormData): Promise<CoverArtUploadData | null> {
  const file = await validateFormFile(formData, 'file');
  const songId = formData.get('songId');

  if (!file || typeof songId !== 'string') {
    return null;
  }

  if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
    throw new Error('Invalid image file type');
  }

  if (!validateFileSize(file, MAX_IMAGE_SIZE)) {
    throw new Error('Image file too large');
  }

  return { file, songId };
}

async function handlePlaylists(request: Request, env: Env): Promise<Response> {
  try {
    switch (request.method) {
      case 'GET':
        const playlists = await env.DB.prepare('SELECT * FROM playlists').all();
        return new Response(JSON.stringify(playlists), {
          headers: { 'Content-Type': 'application/json' }
        });
      
      case 'POST':
        const rawData = await request.json();
        const data = rawData as PlaylistData;
        
        if (!data.name) {
          return createErrorResponse('Name is required', 400);
        }

        const result = await env.DB.prepare(
          `INSERT INTO playlists (name, description, is_public) VALUES (?, ?, ?)`
        ).bind(data.name, data.description || null, data.is_public !== false).run();

        const insertedId = (result as unknown as { lastRowId: number }).lastRowId;
        return new Response(JSON.stringify({ success: true, id: insertedId }), {
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return createErrorResponse('Method not allowed', 405);
    }
  } catch (error) {
    console.error('Playlist error:', error);
    return createErrorResponse('Playlist operation failed', 500);
  }
}

async function handleFavorites(request: Request, env: Env): Promise<Response> {
  try {
    switch (request.method) {
      case 'GET':
        const userId = request.headers.get('X-User-ID');
        if (!userId) {
          return createErrorResponse('User ID required', 401);
        }

        const favorites = await env.DB.prepare(
          `SELECT s.* FROM songs s
           JOIN user_favorites uf ON s.id = uf.song_id
           WHERE uf.user_id = ?`
        ).bind(userId).all();

        return new Response(JSON.stringify(favorites), {
          headers: { 'Content-Type': 'application/json' }
        });

      case 'POST':
        const rawData = await request.json();
        const data = rawData as FavoriteData;
        const userIdPost = request.headers.get('X-User-ID');

        if (!userIdPost || !data.songId) {
          return createErrorResponse('User ID and Song ID required', 400);
        }

        await env.DB.prepare(
          `INSERT INTO user_favorites (user_id, song_id) VALUES (?, ?)`
        ).bind(userIdPost, data.songId).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return createErrorResponse('Method not allowed', 405);
    }
  } catch (error) {
    console.error('Favorites error:', error);
    return createErrorResponse('Favorites operation failed', 500);
  }
}

async function handleSongUpload(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const formData = await request.formData();
    const uploadData = await parseSongUploadData(formData);

    if (!uploadData) {
      return createErrorResponse('Missing or invalid required fields', 400);
    }

    const { file, title, artist, genre } = uploadData;

    // Generate a unique key for the file
    const fileKey = `${Date.now()}-${file.name}`;
    
    // Upload to R2
    await env.MUSIC_STORAGE.put(fileKey, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Store metadata in D1
    await env.DB.prepare(
      `INSERT INTO songs (title, artist, genre, file_url, mime_type, file_size) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(title, artist, genre || null, fileKey, file.type, file.size).run();

    return new Response(
      JSON.stringify({ success: true, fileKey }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return createErrorResponse('Upload failed', 500);
  }
}

async function handleCoverArtUpload(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const formData = await request.formData();
    const uploadData = await parseCoverArtUploadData(formData);

    if (!uploadData) {
      return createErrorResponse('Missing or invalid required fields', 400);
    }

    const { file, songId } = uploadData;
    const fileKey = `cover-${songId}-${Date.now()}`;
    
    // Upload to R2
    await env.COVER_ART_STORAGE.put(fileKey, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Update song record with cover art URL
    await env.DB.prepare(
      `UPDATE songs SET cover_art_url = ? WHERE id = ?`
    ).bind(fileKey, songId).run();

    return new Response(
      JSON.stringify({ success: true, fileKey }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cover art upload error:', error);
    return createErrorResponse('Upload failed', 500);
  }
}

async function handleSearch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  
  if (!query) {
    return createErrorResponse('Query parameter required', 400);
  }

  try {
    const ai = new Ai(env.AI);
    const searchResults = await env.DB.prepare(
      `SELECT * FROM songs WHERE title LIKE ?1 OR artist LIKE ?1`
    ).bind(`%${query}%`).all();

    return new Response(
      JSON.stringify(searchResults),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Search error:', error);
    return createErrorResponse('Search failed', 500);
  }
}

async function handleSongs(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    try {
      const songs = await env.DB.prepare('SELECT * FROM songs').all();
      return new Response(
        JSON.stringify(songs),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Database error:', error);
      return createErrorResponse('Failed to fetch songs', 500);
    }
  }
  
  return createErrorResponse('Method not allowed', 405);
}
