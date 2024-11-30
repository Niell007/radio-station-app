import type { APIRoute } from 'astro';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';

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

// Simple JWT implementation
function createJWT(payload: any, secret: string): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const claims = {
        ...payload,
        iat: now,
        exp: now + 86400 // 24 hours
    };

    const base64Header = btoa(JSON.stringify(header));
    const base64Payload = btoa(JSON.stringify(claims));
    const signature = btoa(
        JSON.stringify({
            data: base64Header + '.' + base64Payload,
            secret
        })
    );

    return `${base64Header}.${base64Payload}.${signature}`;
}

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const data = await request.json();
        // Validate and parse the request data
        const { email, password } = loginSchema.parse(data);

        // Get user from database
        const user = await locals.runtime.env.DB
            .prepare('SELECT * FROM users WHERE email = ?')
            .bind(email)
            .first<DBUser>();

        if (!user) {
            return new Response(JSON.stringify({
                error: 'Invalid email or password'
            }), { status: 401 });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return new Response(JSON.stringify({
                error: 'Invalid email or password'
            }), { status: 401 });
        }

        // Generate session token
        const token = createJWT(
            { sub: user.id.toString(), role: user.role },
            process.env.SESSION_SECRET || 'your-secret-key'
        );

        // Create session in database
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1);

        await locals.runtime.env.DB
            .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
            .bind(sessionId, user.id, expiresAt.toISOString())
            .run();

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