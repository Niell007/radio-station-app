import type { D1Database } from '@cloudflare/workers-types';

export interface KaraokeFile {
    id?: number;
    title: string;
    artist: string;
    language: string;
    genre?: string;
    file_url: string;
    lyrics_url?: string;
    duration: number;
    file_size: number;
    mime_type: string;
    search_vector?: string;
    play_count?: number;
    rating?: number;
    difficulty?: number;
    is_explicit?: boolean;
    is_active?: boolean;
    uploaded_at?: string;
    updated_at?: string;
}

export interface KaraokeSearchParams {
    query?: string;
    language?: string;
    genre?: string;
    rating_min?: number;
    rating_max?: number;
    difficulty_min?: number;
    difficulty_max?: number;
    is_explicit?: boolean;
    sort_by?: 'rating' | 'play_count' | 'uploaded_at';
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
}

export interface KaraokeListParams {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    filter?: string;
}

export class KaraokeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'KaraokeError';
    }
}

export class KaraokeManager {
    private db: D1Database;

    constructor(db: D1Database) {
        this.db = db;
    }

    private validateKaraokeFile(file: KaraokeFile): void {
        if (!file.title?.trim()) {
            throw new KaraokeError('Title is required');
        }
        if (!file.artist?.trim()) {
            throw new KaraokeError('Artist is required');
        }
        if (!file.language?.trim() || file.language.length !== 2) {
            throw new KaraokeError('Language must be a 2-letter code');
        }
        if (!file.file_url?.trim()) {
            throw new KaraokeError('File URL is required');
        }
        if (file.file_size <= 0) {
            throw new KaraokeError('File size must be positive');
        }
        if (file.duration < 0) {
            throw new KaraokeError('Duration cannot be negative');
        }
        if (!['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg'].includes(file.mime_type)) {
            throw new KaraokeError('Invalid mime type');
        }
        if (file.rating !== undefined && (file.rating < 0 || file.rating > 5)) {
            throw new KaraokeError('Rating must be between 0 and 5');
        }
        if (file.difficulty !== undefined && (file.difficulty < 1 || file.difficulty > 5)) {
            throw new KaraokeError('Difficulty must be between 1 and 5');
        }
    }

    private generateSearchVector(file: KaraokeFile): string {
        return [
            file.title,
            file.artist,
            file.language,
            file.genre,
            file.is_explicit ? 'explicit' : ''
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
    }

    async create(file: KaraokeFile): Promise<number> {
        this.validateKaraokeFile(file);

        const search_vector = this.generateSearchVector(file);
        const now = new Date().toISOString();

        const result = await this.db.prepare(`
            INSERT INTO karaoke_files (
                title, artist, language, genre, file_url, lyrics_url,
                duration, file_size, mime_type, search_vector, play_count,
                rating, difficulty, is_explicit, is_active,
                uploaded_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            file.title,
            file.artist,
            file.language,
            file.genre || null,
            file.file_url,
            file.lyrics_url || null,
            file.duration,
            file.file_size,
            file.mime_type,
            search_vector,
            file.play_count || 0,
            file.rating || null,
            file.difficulty || null,
            file.is_explicit ? 1 : 0,
            file.is_active !== false ? 1 : 0,
            now,
            now
        ).run();

        return result.meta.last_row_id || 0;
    }

    async update(id: number, file: Partial<KaraokeFile>): Promise<void> {
        const current = await this.getById(id);
        if (!current) {
            throw new KaraokeError('Karaoke file not found');
        }

        const updated = { ...current, ...file };
        this.validateKaraokeFile(updated);

        const search_vector = this.generateSearchVector(updated);
        const now = new Date().toISOString();

        await this.db.prepare(`
            UPDATE karaoke_files SET
                title = ?, artist = ?, language = ?, genre = ?,
                file_url = ?, lyrics_url = ?, duration = ?,
                file_size = ?, mime_type = ?, search_vector = ?,
                play_count = ?, rating = ?, difficulty = ?,
                is_explicit = ?, is_active = ?, updated_at = ?
            WHERE id = ?
        `).bind(
            updated.title,
            updated.artist,
            updated.language,
            updated.genre || null,
            updated.file_url,
            updated.lyrics_url || null,
            updated.duration,
            updated.file_size,
            updated.mime_type,
            search_vector,
            updated.play_count || 0,
            updated.rating || null,
            updated.difficulty || null,
            updated.is_explicit ? 1 : 0,
            updated.is_active !== false ? 1 : 0,
            now,
            id
        ).run();
    }

    async getById(id: number): Promise<KaraokeFile | null> {
        const result = await this.db.prepare(`
            SELECT * FROM karaoke_files WHERE id = ?
        `).bind(id).first<KaraokeFile>();

        if (!result) return null;

        return {
            ...result,
            is_explicit: Boolean(result.is_explicit),
            is_active: Boolean(result.is_active)
        };
    }

    async search(params: KaraokeSearchParams = {}): Promise<{ data: KaraokeFile[], total: number }> {
        const conditions: string[] = ['is_active = 1'];
        const values: any[] = [];

        if (params.query) {
            conditions.push('search_vector LIKE ?');
            values.push(`%${params.query.toLowerCase()}%`);
        }

        if (params.language) {
            conditions.push('language = ?');
            values.push(params.language);
        }

        if (params.genre) {
            conditions.push('genre = ?');
            values.push(params.genre);
        }

        if (params.rating_min !== undefined) {
            conditions.push('rating >= ?');
            values.push(params.rating_min);
        }

        if (params.rating_max !== undefined) {
            conditions.push('rating <= ?');
            values.push(params.rating_max);
        }

        if (params.difficulty_min !== undefined) {
            conditions.push('difficulty >= ?');
            values.push(params.difficulty_min);
        }

        if (params.difficulty_max !== undefined) {
            conditions.push('difficulty <= ?');
            values.push(params.difficulty_max);
        }

        if (params.is_explicit !== undefined) {
            conditions.push('is_explicit = ?');
            values.push(params.is_explicit ? 1 : 0);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const sort = params.sort_by ? 
            `ORDER BY ${params.sort_by} ${params.sort_order === 'asc' ? 'ASC' : 'DESC'}` : 
            'ORDER BY uploaded_at DESC';
        
        const page = Math.max(1, params.page || 1);
        const per_page = Math.min(100, Math.max(1, params.per_page || 20));
        const offset = (page - 1) * per_page;

        const countResult = await this.db.prepare(`
            SELECT COUNT(*) as count FROM karaoke_files ${where}
        `).bind(...values).first<{ count: number }>();

        const results = await this.db.prepare(`
            SELECT * FROM karaoke_files
            ${where}
            ${sort}
            LIMIT ? OFFSET ?
        `).bind(...values, per_page, offset).all<KaraokeFile>();

        return {
            data: results.results.map(result => ({
                ...result,
                is_explicit: Boolean(result.is_explicit),
                is_active: Boolean(result.is_active)
            })),
            total: countResult?.count || 0
        };
    }

    async incrementPlayCount(id: number): Promise<void> {
        await this.db.prepare(`
            UPDATE karaoke_files
            SET play_count = play_count + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(id).run();
    }

    async updateRating(id: number, rating: number): Promise<void> {
        if (rating < 0 || rating > 5) {
            throw new KaraokeError('Rating must be between 0 and 5');
        }

        await this.db.prepare(`
            UPDATE karaoke_files
            SET rating = (
                CASE 
                    WHEN rating IS NULL THEN ?
                    ELSE (rating + ?) / 2
                END
            ),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(rating, rating, id).run();
    }

    async getDuplicates(): Promise<any[]> {
        const results = await this.db.prepare(`
            SELECT * FROM karaoke_duplicates
        `).all();
        return results.results;
    }

    async getStats(): Promise<any> {
        const results = await this.db.prepare(`
            SELECT * FROM karaoke_stats
        `).first();
        return results;
    }

    async list(params: KaraokeListParams = {}): Promise<{ files: KaraokeFile[], total: number }> {
        const conditions: string[] = ['is_active = 1'];
        const values: any[] = [];

        // Handle search
        if (params.search?.trim()) {
            conditions.push('search_vector LIKE ?');
            values.push(`%${params.search.toLowerCase()}%`);
        }

        // Handle filters
        switch (params.filter) {
            case 'explicit':
                conditions.push('is_explicit = 1');
                break;
            case 'clean':
                conditions.push('is_explicit = 0');
                break;
            case 'withLyrics':
                conditions.push('lyrics_url IS NOT NULL');
                break;
            case 'noLyrics':
                conditions.push('lyrics_url IS NULL');
                break;
        }

        // Build WHERE clause
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        // Handle sorting
        let orderBy = 'uploaded_at DESC';
        if (params.sort) {
            const direction = params.order === 'asc' ? 'ASC' : 'DESC';
            orderBy = `${params.sort} ${direction}`;
        }

        // Handle pagination
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(100, Math.max(1, params.limit || 10));
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await this.db.prepare(`
            SELECT COUNT(*) as count FROM karaoke_files ${where}
        `).bind(...values).first<{ count: number }>();

        // Get paginated results
        const results = await this.db.prepare(`
            SELECT * FROM karaoke_files
            ${where}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `).bind(...values, limit, offset).all<KaraokeFile>();

        return {
            files: results.results.map(result => ({
                ...result,
                is_explicit: Boolean(result.is_explicit),
                is_active: Boolean(result.is_active)
            })),
            total: countResult?.count || 0
        };
    }
}
