import type { MiddlewareHandler } from 'astro';
import type { AstroCookies } from 'astro';
import { prisma } from '../lib/prisma';

// Extend Astro's Locals type
declare module 'astro' {
  interface Locals {
    user: AuthenticatedUser | null;
    runtime: {
      env: {
        DB: D1Database;
        BUCKET: R2Bucket;
        AI: any;
        YOUR_NAMESPACE_BINDING: KVNamespace;
      };
    };
  }
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Middleware handler
export const onRequest: MiddlewareHandler = async ({ cookies, locals, request }, next) => {
  locals.user = await authenticateUser(cookies, locals.runtime.env.YOUR_NAMESPACE_BINDING);
  return next();
};

// Helper function to authenticate user from session
export async function authenticateUser(cookies: AstroCookies, kvNamespace: KVNamespace): Promise<AuthenticatedUser | null> {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) return null;

  try {
    const session = await kvNamespace.get(sessionId, { type: 'json' });

    if (!session || session.expiresAt < new Date().toISOString()) {
      cookies.delete('session', { path: '/' });
      return null;
    }

    return {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      role: session.user.role
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// Helper function to check if user is authenticated
export async function isAuthenticated(context: { cookies: AstroCookies; locals: { runtime: { env: { YOUR_NAMESPACE_BINDING: KVNamespace } } } }): Promise<boolean> {
  const user = await authenticateUser(context.cookies, context.locals.runtime.env.YOUR_NAMESPACE_BINDING);
  return user !== null;
}

// Helper function to get user
export async function getUser(context: { cookies: AstroCookies; locals: { runtime: { env: { YOUR_NAMESPACE_BINDING: KVNamespace } } } }): Promise<AuthenticatedUser | null> {
  return authenticateUser(context.cookies, context.locals.runtime.env.YOUR_NAMESPACE_BINDING);
}

// Middleware to require authentication
export function requireAuth(roles?: string[]) {
  return async (context: { cookies: AstroCookies; request: Request; locals: { runtime: { env: { YOUR_NAMESPACE_BINDING: KVNamespace } } } }) => {
    const user = await authenticateUser(context.cookies, context.locals.runtime.env.YOUR_NAMESPACE_BINDING);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    if (roles && !roles.includes(user.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403 }
      );
    }

    (context.request as AuthenticatedRequest).user = user;
    return null;
  };
}
