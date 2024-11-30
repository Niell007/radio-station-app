import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const { key } = context.params;
  if (!key) {
    return new Response('File key is required', { status: 400 });
  }

  try {
    const bucket = context.locals.runtime.env.BUCKET;
    const file = await bucket.get(key);

    if (!file) {
      return new Response('File not found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', file.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Content-Length', file.size.toString());
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    return new Response(file.body, { headers });
  } catch (error) {
    console.error('Error serving file:', error);
    return new Response('Internal server error', { status: 500 });
  }
}; 