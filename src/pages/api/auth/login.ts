import type { APIRoute } from 'astro';
import { verify } from '@node-rs/argon2';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { username, password } = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 401 }
      );
    }

    // Verify password
    const validPassword = await verify(user.passwordHash, password);
    if (!validPassword) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 401 }
      );
    }

    // Create session
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        expiresAt
      }
    });

    return new Response(
      JSON.stringify({
        sessionId,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }),
      {
        status: 200,
        headers: {
          'Set-Cookie': `session=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Expires=${expiresAt.toUTCString()}`
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input data', details: error.errors }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}; 