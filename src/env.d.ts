/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface D1Result<T = unknown> extends D1Response {
  lastRowId: number | null;
  changes: number;
  duration: number;
  results: T[];
}

interface Env {
  DB: D1Database;
  MUSIC_STORAGE: R2Bucket;
  AI: {
    run: (model: string, options: { text: string[] }) => Promise<{
      data: Array<{ embedding: number[] }>;
    }>;
  };
}

declare namespace App {
  interface Locals {
    runtime: {
      env: Env;
    };
  }
}

// Extend window for audio player
interface Window {
  audioPlayer: {
    playSong: (song: {
      id: number;
      title: string;
      artist: string;
      fileUrl: string;
      duration: number;
    }) => void;
  };
}

// Database types
interface DBUser {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface DBSession {
  id: string;
  user_id: number;
  expires_at: string;
}

interface DBSong {
  id: number;
  title: string;
  artist: string;
  genre: string | null;
  file_url: string;
  duration: number;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  updated_at: string;
}

interface DBShow {
  id: number;
  title: string;
  description: string | null;
  host_id: number;
  start_time: string;
  end_time: string;
  days_of_week: string;
  created_at: string;
  updated_at: string;
}

interface DBPlaylist {
  id: number;
  title: string;
  description: string | null;
  user_id: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface DBPlaylistSong {
  playlist_id: number;
  song_id: number;
  position: number;
  added_at: string;
}

interface DBKaraokeFile {
  id: number;
  title: string;
  artist: string;
  language: string;
  genre: string | null;
  file_url: string;
  lyrics_url: string | null;
  duration: number;
  file_size: number;
  mime_type: string;
  search_vector: string;
  uploaded_at: string;
  updated_at: string;
} 