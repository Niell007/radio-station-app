import type { APIRoute } from 'astro';
import { requireAuth } from '../../../middleware/auth';

const searchSchema = {
  type: 'object',
  properties: {
    query: { type: 'string' },
    language: { type: 'string', optional: true },
    genre: { type: 'string', optional: true },
    limit: { type: 'number', optional: true },
    offset: { type: 'number', optional: true }
  }
};

export const POST: APIRoute = async (context) => {
  const authResponse = await requireAuth()(context);
  if (authResponse) return authResponse;

  try {
    const { query, language, genre, limit = 20, offset = 0 } = await context.request.json();

    // Get AI instance
    const ai = context.locals.runtime.env.AI;

    // Generate embeddings for the search query
    const { data: [{ embedding }] } = await ai.run('@cf/baai/bge-base-en-v1.5', {
      text: [query]
    });

    // Build the SQL query
    let sql = `
      SELECT 
        id, title, artist, language, genre, 
        file_url, lyrics_url, duration
      FROM karaoke_files
      WHERE 1=1
    `;
    const params: any[] = [];

    // Add language filter if specified
    if (language) {
      sql += ' AND language = ?';
      params.push(language);
    }

    // Add genre filter if specified
    if (genre) {
      sql += ' AND genre = ?';
      params.push(genre);
    }

    // Add semantic search using vector similarity
    if (query) {
      sql += `
        AND search_vector IS NOT NULL
        ORDER BY (
          SELECT similarity(search_vector, ?)
        ) DESC
      `;
      params.push(JSON.stringify(embedding));
    } else {
      sql += ' ORDER BY uploaded_at DESC';
    }

    // Add pagination
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Execute search
    const db = context.locals.runtime.env.DB;
    const results = await db
      .prepare(sql)
      .bind(...params)
      .all();

    // Get total count for pagination
    const totalCount = await db
      .prepare('SELECT COUNT(*) as count FROM karaoke_files WHERE 1=1')
      .first();

    return new Response(
      JSON.stringify({
        results: results.results,
        total: totalCount.count,
        limit,
        offset
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error searching karaoke files:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}; 