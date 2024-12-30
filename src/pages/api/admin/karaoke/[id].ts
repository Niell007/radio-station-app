import type { APIRoute } from 'astro';
import { KaraokeManager } from '../../../../lib/karaoke';

export const PUT: APIRoute = async ({ request, params, locals }) => {
  try {
    const id = parseInt(params.id as string);
    const data = await request.json();

    const manager = new KaraokeManager(locals.env.DB);
    await manager.update(id, data);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error updating karaoke file:', error);
    return new Response(JSON.stringify({ error: 'Failed to update karaoke file' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const id = parseInt(params.id as string);

    const manager = new KaraokeManager(locals.env.DB);
    await manager.delete(id);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error deleting karaoke file:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete karaoke file' }), { status: 500 });
  }
};
