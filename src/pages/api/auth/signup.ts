import type { APIRoute } from 'astro';
import { hash } from '@node-rs/argon2';
import { z } from 'zod';

const signupSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { username, email, password } = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await locals.env.DB.prepare(`
      SELECT * FROM users WHERE username = ? OR email = ?
    `).bind(username, email).first();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Username or email already exists' }),
        { status: 400 }
      );
    }

    // Hash password and create user
    const passwordHash = await hash(password);
    const result = await locals.env.DB.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, 'user')
    `).bind(username, email, passwordHash).run();

    const userId = result.lastRowId;

    return new Response(
      JSON.stringify({
        id: userId,
        username,
        email,
        role: 'user'
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
