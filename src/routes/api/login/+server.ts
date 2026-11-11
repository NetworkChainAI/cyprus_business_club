import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { comparePasswords } from '$lib/crypto';
import { signJwt } from '$lib/jwt';
import { checkRateLimit, getClientIp } from '$lib/server/security';

export const POST = async ({ request, cookies }: RequestEvent) => {
  try {
    // Rate limit: 10 attempts per 15 minutes per IP
    const ip = getClientIp(request);
    const rl = checkRateLimit("login", ip, 10, 15 * 60_000);
    if (rl) return rl;

    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response('Email and password are required', { status: 400 });
    }

    const user = await prisma.cbcUser.findUnique({ where: { email } });

    // Generic error message to prevent user enumeration
    if (!user || !user.password) {
      return new Response('Invalid email or password', { status: 401 });
    }

    const isValid = await comparePasswords(password, user.password);

    if (!isValid) {
      return new Response('Invalid email or password', { status: 401 });
    }

    const token = await signJwt({ uid: user.id, email: user.email });

    cookies.set('auth_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    return new Response(JSON.stringify({ user: { id: user.id, email: user.email } }), { status: 200 });
  } catch (err) {
    console.error('Login error:', err);
    return new Response('Internal server error', { status: 500 });
  }
};
