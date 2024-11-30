-- Drop existing objects first
DROP VIEW IF EXISTS karaoke_by_language;
DROP VIEW IF EXISTS karaoke_by_genre;
DROP VIEW IF EXISTS karaoke_popular;
DROP VIEW IF EXISTS karaoke_top_rated;
DROP VIEW IF EXISTS karaoke_recent;
DROP VIEW IF EXISTS karaoke_stats;
DROP VIEW IF EXISTS karaoke_difficulty_stats;
DROP VIEW IF EXISTS karaoke_artist_stats;
DROP VIEW IF EXISTS karaoke_monthly_stats;
DROP VIEW IF EXISTS karaoke_search;
DROP VIEW IF EXISTS karaoke_duplicates;
DROP TRIGGER IF EXISTS update_karaoke_timestamp;
DROP INDEX IF EXISTS idx_karaoke_search;
DROP INDEX IF EXISTS idx_karaoke_language;
DROP INDEX IF EXISTS idx_karaoke_genre;
DROP INDEX IF EXISTS idx_karaoke_rating;
DROP INDEX IF EXISTS idx_karaoke_play_count;
DROP INDEX IF EXISTS idx_karaoke_active;
DROP INDEX IF EXISTS idx_karaoke_difficulty;
DROP INDEX IF EXISTS idx_karaoke_uploaded;
DROP INDEX IF EXISTS idx_karaoke_artist;
DROP INDEX IF EXISTS idx_karaoke_title;
DROP INDEX IF EXISTS idx_karaoke_composite;

-- Create karaoke_files table
DROP TABLE IF EXISTS karaoke_files;
CREATE TABLE karaoke_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    language TEXT NOT NULL,
    genre TEXT,
    file_url TEXT NOT NULL,
    lyrics_url TEXT,
    duration INTEGER NOT NULL DEFAULT 0,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    search_vector TEXT,
    play_count INTEGER NOT NULL DEFAULT 0,
    rating REAL,
    difficulty INTEGER,
    is_explicit INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_karaoke_search ON karaoke_files(search_vector) WHERE search_vector IS NOT NULL;
CREATE INDEX idx_karaoke_language ON karaoke_files(language);
CREATE INDEX idx_karaoke_genre ON karaoke_files(genre) WHERE genre IS NOT NULL;
CREATE INDEX idx_karaoke_rating ON karaoke_files(rating) WHERE rating IS NOT NULL;
CREATE INDEX idx_karaoke_play_count ON karaoke_files(play_count) WHERE play_count > 0;
CREATE INDEX idx_karaoke_active ON karaoke_files(is_active) WHERE is_active = 1;
CREATE INDEX idx_karaoke_difficulty ON karaoke_files(difficulty) WHERE difficulty IS NOT NULL;
CREATE INDEX idx_karaoke_uploaded ON karaoke_files(uploaded_at DESC);
CREATE INDEX idx_karaoke_artist ON karaoke_files(artist COLLATE NOCASE);
CREATE INDEX idx_karaoke_title ON karaoke_files(title COLLATE NOCASE);
CREATE INDEX idx_karaoke_composite ON karaoke_files(is_active, language, genre) WHERE is_active = 1;

-- Create views for analytics
CREATE VIEW karaoke_by_language AS
SELECT 
    language, 
    COUNT(*) as count, 
    ROUND(AVG(CAST(rating AS FLOAT)), 2) as avg_rating, 
    SUM(play_count) as total_plays,
    COUNT(CASE WHEN difficulty IS NOT NULL THEN 1 END) as rated_songs,
    ROUND(AVG(CAST(difficulty AS FLOAT)), 2) as avg_difficulty,
    COUNT(CASE WHEN is_explicit = 1 THEN 1 END) as explicit_songs,
    COUNT(DISTINCT artist) as unique_artists,
    COUNT(DISTINCT genre) as unique_genres
FROM karaoke_files
WHERE is_active = 1
GROUP BY language
ORDER BY count DESC;

CREATE VIEW karaoke_by_genre AS
SELECT 
    genre, 
    COUNT(*) as count, 
    ROUND(AVG(CAST(rating AS FLOAT)), 2) as avg_rating, 
    SUM(play_count) as total_plays,
    COUNT(CASE WHEN difficulty IS NOT NULL THEN 1 END) as rated_songs,
    ROUND(AVG(CAST(difficulty AS FLOAT)), 2) as avg_difficulty,
    COUNT(CASE WHEN is_explicit = 1 THEN 1 END) as explicit_songs,
    COUNT(DISTINCT artist) as unique_artists,
    COUNT(DISTINCT language) as unique_languages
FROM karaoke_files
WHERE is_active = 1 AND genre IS NOT NULL
GROUP BY genre
ORDER BY count DESC;

CREATE VIEW karaoke_popular AS
SELECT 
    id,
    title,
    artist,
    language,
    genre,
    file_url,
    lyrics_url,
    duration,
    file_size,
    mime_type,
    play_count,
    ROUND(CAST(rating AS FLOAT), 2) as rating,
    difficulty,
    is_explicit,
    uploaded_at,
    ROUND(CAST(play_count AS FLOAT) / (SELECT MAX(play_count) FROM karaoke_files) * 100, 2) as popularity_score
FROM karaoke_files
WHERE is_active = 1
ORDER BY play_count DESC, rating DESC NULLS LAST
LIMIT 100;

CREATE VIEW karaoke_top_rated AS
SELECT 
    k1.id,
    k1.title,
    k1.artist,
    k1.language,
    k1.genre,
    k1.file_url,
    k1.lyrics_url,
    k1.duration,
    k1.file_size,
    k1.mime_type,
    k1.play_count,
    ROUND(CAST(k1.rating AS FLOAT), 2) as rating,
    k1.difficulty,
    k1.is_explicit,
    k1.uploaded_at,
    (SELECT COUNT(*) FROM karaoke_files k2 
     WHERE k2.rating >= k1.rating 
     AND k2.is_active = 1 
     AND k2.rating IS NOT NULL) as rank,
    ROUND(CAST(k1.play_count AS FLOAT) / (SELECT MAX(play_count) FROM karaoke_files) * 100, 2) as popularity_score
FROM karaoke_files k1
WHERE k1.is_active = 1 AND k1.rating IS NOT NULL
ORDER BY k1.rating DESC, k1.play_count DESC
LIMIT 100;

CREATE VIEW karaoke_recent AS
SELECT 
    id,
    title,
    artist,
    language,
    genre,
    duration,
    ROUND(CAST(rating AS FLOAT), 2) as rating,
    difficulty,
    is_explicit,
    uploaded_at,
    play_count,
    ROUND(CAST(play_count AS FLOAT) / (SELECT MAX(play_count) FROM karaoke_files) * 100, 2) as popularity_score
FROM karaoke_files
WHERE is_active = 1
ORDER BY uploaded_at DESC
LIMIT 50;

CREATE VIEW karaoke_stats AS
SELECT
    COUNT(*) as total_songs,
    COUNT(DISTINCT language) as total_languages,
    COUNT(DISTINCT genre) as total_genres,
    COUNT(DISTINCT artist) as total_artists,
    SUM(play_count) as total_plays,
    ROUND(AVG(CAST(rating AS FLOAT)), 2) as avg_rating,
    ROUND(AVG(CAST(difficulty AS FLOAT)), 2) as avg_difficulty,
    COUNT(CASE WHEN is_explicit = 1 THEN 1 END) as explicit_songs,
    ROUND(SUM(duration) / 60.0, 2) as total_duration_minutes,
    ROUND(SUM(file_size) / (1024.0 * 1024.0), 2) as total_size_mb,
    ROUND(AVG(play_count), 2) as avg_plays_per_song,
    COUNT(CASE WHEN rating IS NOT NULL THEN 1 END) as rated_songs,
    COUNT(CASE WHEN difficulty IS NOT NULL THEN 1 END) as difficulty_rated_songs
FROM karaoke_files
WHERE is_active = 1;

CREATE VIEW karaoke_difficulty_stats AS
SELECT
    difficulty,
    COUNT(*) as count,
    ROUND(AVG(CAST(rating AS FLOAT)), 2) as avg_rating,
    SUM(play_count) as total_plays,
    COUNT(DISTINCT language) as languages_count,
    COUNT(DISTINCT genre) as genres_count,
    ROUND(AVG(duration), 0) as avg_duration_seconds,
    COUNT(DISTINCT artist) as unique_artists,
    COUNT(CASE WHEN is_explicit = 1 THEN 1 END) as explicit_songs,
    ROUND(AVG(play_count), 2) as avg_plays_per_song
FROM karaoke_files
WHERE is_active = 1 AND difficulty IS NOT NULL
GROUP BY difficulty
ORDER BY difficulty;

CREATE VIEW karaoke_artist_stats AS
SELECT
    artist,
    COUNT(*) as song_count,
    COUNT(DISTINCT language) as languages_count,
    COUNT(DISTINCT genre) as genres_count,
    SUM(play_count) as total_plays,
    ROUND(AVG(CAST(rating AS FLOAT)), 2) as avg_rating,
    ROUND(AVG(CAST(difficulty AS FLOAT)), 2) as avg_difficulty,
    COUNT(CASE WHEN is_explicit = 1 THEN 1 END) as explicit_songs,
    ROUND(SUM(duration) / 60.0, 2) as total_duration_minutes,
    ROUND(AVG(play_count), 2) as avg_plays_per_song
FROM karaoke_files
WHERE is_active = 1
GROUP BY artist
ORDER BY song_count DESC, total_plays DESC;

CREATE VIEW karaoke_monthly_stats AS
SELECT
    substr(uploaded_at, 1, 7) as month,
    COUNT(*) as new_songs,
    COUNT(DISTINCT artist) as unique_artists,
    COUNT(DISTINCT language) as unique_languages,
    COUNT(DISTINCT genre) as unique_genres,
    ROUND(AVG(CAST(rating AS FLOAT)), 2) as avg_rating,
    ROUND(AVG(CAST(difficulty AS FLOAT)), 2) as avg_difficulty,
    SUM(play_count) as total_plays,
    COUNT(CASE WHEN is_explicit = 1 THEN 1 END) as explicit_songs
FROM karaoke_files
WHERE is_active = 1
GROUP BY substr(uploaded_at, 1, 7)
ORDER BY month DESC;

CREATE VIEW karaoke_search AS
SELECT 
    id,
    title,
    artist,
    language,
    genre,
    duration,
    ROUND(CAST(rating AS FLOAT), 2) as rating,
    difficulty,
    is_explicit,
    play_count,
    search_vector,
    ROUND(CAST(play_count AS FLOAT) / (SELECT MAX(play_count) FROM karaoke_files) * 100, 2) as popularity_score
FROM karaoke_files
WHERE is_active = 1;

CREATE VIEW karaoke_duplicates AS
WITH duplicates AS (
    SELECT 
        title,
        artist,
        COUNT(*) as count,
        GROUP_CONCAT(id) as duplicate_ids,
        GROUP_CONCAT(file_url) as file_urls,
        GROUP_CONCAT(uploaded_at) as upload_dates
    FROM karaoke_files
    WHERE is_active = 1
    GROUP BY lower(trim(title)), lower(trim(artist))
    HAVING COUNT(*) > 1
)
SELECT 
    title,
    artist,
    count as duplicate_count,
    duplicate_ids,
    file_urls,
    upload_dates
FROM duplicates
ORDER BY count DESC, title, artist;
  