import type { APIRoute } from 'astro';
import { hash } from '@node-rs/argon2';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';
import { createCipheriv, randomBytes, createDecipheriv } from 'crypto';

const signupSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

const algorithm = 'aes-256-ctr';
const secretKey = process.env.SECRET_KEY || 'your-secret-key';
const iv = randomBytes(16);

function encrypt(text: string) {
  const cipher = createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(hash: string) {
  const [iv, content] = hash.split(':');
  const decipher = createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);
  return decrypted.toString();
}

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
    const encryptedPasswordHash = encrypt(passwordHash);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: encryptedPasswordHash,
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
