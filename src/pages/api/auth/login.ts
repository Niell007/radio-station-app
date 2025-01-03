import type { APIRoute } from 'astro';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createSecretKey, createHmac } from 'crypto';

// Define the login request schema
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

// Define the database user type
interface DBUser {
    id: number;
    email: string;
    password_hash: string;
    role: string;
}

// Simple JWT implementation with HMAC SHA-256 encryption
function createJWT(payload: any, secret: string): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const claims = {
        ...payload,
        iat: now,
        exp: now + 86400 // 24 hours
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64');
    const base64Payload = Buffer.from(JSON.stringify(claims)).toString('base64');
    const signature = createHmac('sha256', createSecretKey(Buffer.from(secret)))
        .update(`${base64Header}.${base64Payload}`)
        .digest('base64');

    return `${base64Header}.${base64Payload}.${signature}`;
}

async function loginUser(email: string, password: string, db: any, secret: string) {
    // Get user from database
    const user = await db
        .prepare('SELECT * FROM users WHERE email = ?')
        .bind(email)
        .first<DBUser>();

    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
        throw new Error('Invalid email or password');
    }

    // Generate session token
    const token = createJWT(
        { sub: user.id.toString(), role: user.role },
        secret
    );

    // Create session in database
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    await db
        .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
        .bind(sessionId, user.id, expiresAt.toISOString())
        .run();

    return { token, user };
}

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const data = await request.json();
        // Validate and parse the request data
        const { email, password } = loginSchema.parse(data);

        const { token, user } = await loginUser(email, password, locals.runtime.env.DB, process.env.SESSION_SECRET || 'your-secret-key');

        return new Response(JSON.stringify({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        }), {
            status: 200,
            headers: {
                'Set-Cookie': `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify({
                error: 'Invalid input',
                details: error.errors
            }), { status: 400 });
        }
        return new Response(JSON.stringify({
            error: 'Internal server error'
        }), { status: 500 });
    }
};
