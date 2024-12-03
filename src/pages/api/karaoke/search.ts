import type { APIRoute } from 'astro';
import { KaraokeManager } from '../../../lib/karaoke';
import { z } from 'zod';

const searchParamsSchema = z.object({
    query: z.string().optional(),
    language: z.string().optional(),
    genre: z.string().optional(),
    limit: z.number().default(20),
    offset: z.number().default(0)
});

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const data = await request.json();
        const params = searchParamsSchema.parse(data);

        const manager = new KaraokeManager(locals.runtime.env.DB);
        const { data: files, total } = await manager.search({
            query: params.query,
            language: params.language,
            genre: params.genre,
            per_page: params.limit,
            page: Math.floor(params.offset / params.limit) + 1
        });

        return new Response(JSON.stringify({
            files,
            total
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error searching karaoke files:', error);
        return new Response(JSON.stringify({
            error: 'Failed to search karaoke files'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};

export const searchKaraokeFiles = async (params: any, db: any) => {
    const manager = new KaraokeManager(db);
    const { data: files, total } = await manager.search(params);
    return { files, total };
};
