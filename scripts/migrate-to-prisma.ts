import { PrismaClient } from '@prisma/client';
import { Database } from 'better-sqlite3';
import path from 'path';

const prisma = new PrismaClient();
const db = new Database(path.join(process.cwd(), 'data.db'));

async function migrateUsers() {
  const users = db.prepare('SELECT * FROM users').all();
  for (const user of users) {
    await prisma.user.create({
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: user.password_hash,
        role: user.role,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      },
    });
  }
}

async function migrateSessions() {
  const sessions = db.prepare('SELECT * FROM sessions').all();
  for (const session of sessions) {
    await prisma.session.create({
      data: {
        id: session.id,
        userId: session.user_id,
        expiresAt: new Date(session.expires_at),
      },
    });
  }
}

async function migrateShows() {
  const shows = db.prepare('SELECT * FROM shows').all();
  for (const show of shows) {
    await prisma.show.create({
      data: {
        id: show.id,
        title: show.title,
        description: show.description,
        hostId: show.host_id,
        startTime: show.start_time,
        endTime: show.end_time,
        daysOfWeek: show.days_of_week,
        createdAt: new Date(show.created_at),
        updatedAt: new Date(show.updated_at),
      },
    });
  }
}

async function migrateSongs() {
  const songs = db.prepare('SELECT * FROM songs').all();
  for (const song of songs) {
    await prisma.song.create({
      data: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        genre: song.genre,
        fileUrl: song.file_url,
        duration: song.duration,
        fileSize: song.file_size,
        mimeType: song.mime_type,
        uploadedAt: new Date(song.uploaded_at),
        updatedAt: new Date(song.updated_at),
      },
    });
  }
}

async function migratePlaylists() {
  const playlists = db.prepare('SELECT * FROM playlists').all();
  for (const playlist of playlists) {
    await prisma.playlist.create({
      data: {
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        userId: playlist.user_id,
        isPublic: Boolean(playlist.is_public),
        createdAt: new Date(playlist.created_at),
        updatedAt: new Date(playlist.updated_at),
      },
    });
  }
}

async function migratePlaylistSongs() {
  const playlistSongs = db.prepare('SELECT * FROM playlist_songs').all();
  for (const ps of playlistSongs) {
    await prisma.playlistSong.create({
      data: {
        playlistId: ps.playlist_id,
        songId: ps.song_id,
        position: ps.position,
        addedAt: new Date(ps.added_at),
      },
    });
  }
}

async function migrateKaraokeFiles() {
  const karaokeFiles = db.prepare('SELECT * FROM karaoke_files').all();
  for (const kf of karaokeFiles) {
    await prisma.karaokeFile.create({
      data: {
        id: kf.id,
        title: kf.title,
        artist: kf.artist,
        language: kf.language,
        genre: kf.genre,
        fileUrl: kf.file_url,
        lyricsUrl: kf.lyrics_url,
        duration: kf.duration,
        fileSize: kf.file_size,
        mimeType: kf.mime_type,
        searchVector: kf.search_vector,
        uploadedAt: new Date(kf.uploaded_at),
        updatedAt: new Date(kf.updated_at),
      },
    });
  }
}

async function main() {
  try {
    console.log('Starting migration...');
    
    await migrateUsers();
    console.log('Users migrated');
    
    await migrateSessions();
    console.log('Sessions migrated');
    
    await migrateShows();
    console.log('Shows migrated');
    
    await migrateSongs();
    console.log('Songs migrated');
    
    await migratePlaylists();
    console.log('Playlists migrated');
    
    await migratePlaylistSongs();
    console.log('Playlist songs migrated');
    
    await migrateKaraokeFiles();
    console.log('Karaoke files migrated');
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    db.close();
  }
}

main(); 