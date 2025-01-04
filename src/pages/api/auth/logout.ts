import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { createSecretKey, createHmac } from 'crypto';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    const sessionId = cookies.get('session')?.value;
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401 }
      );
    }

    // Decrypt session ID
    const decryptedSessionId = decryptSessionId(sessionId, process.env.SESSION_SECRET || 'your-secret-key');

    // Delete session from database
    const session = await prisma.session.delete({
      where: { id: decryptedSessionId }
    }).catch(() => {
      // Ignore errors if session doesn't exist
    });

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404 }
      );
    }

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

// Decrypt session ID function
function decryptSessionId(encryptedSessionId: string, secret: string): string {
  const [base64Header, base64Payload, signature] = encryptedSessionId.split('.');
  const expectedSignature = createHmac('sha256', createSecretKey(Buffer.from(secret)))
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64');

  if (signature !== expectedSignature) {
    throw new Error('Invalid session ID');
  }

  const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
  return payload.sub;
}
