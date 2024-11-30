import type { APIRoute } from 'astro';
import { hash } from '@node-rs/argon2';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

const signupSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { username, email, password } = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Username or email already exists' }),
        { status: 400 }
      );
    }

    // Hash password and create user
    const passwordHash = await hash(password);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: 'user'
      }
    });

    return new Response(
      JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
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