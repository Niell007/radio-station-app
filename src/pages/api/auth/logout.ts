import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    const sessionId = cookies.get('session')?.value;
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Not logged in' }),
        { status: 401 }
      );
    }

    // Delete session from database
    await prisma.session.delete({
      where: { id: sessionId }
    }).catch(() => {
      // Ignore errors if session doesn't exist
    });

    // Clear session cookie
    cookies.delete('session', { path: '/' });

    return new Response(
      JSON.stringify({ message: 'Logged out successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
