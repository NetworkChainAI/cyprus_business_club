import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export const GET = async ({ cookies }: RequestEvent) => {
  try {
    const token = cookies.get('auth_token');

    if (!token) {
      return json({ unread: 0 });
    }

    const payload = await verifyJwt(token);

    if (!payload?.uid) {
      return json({ unread: 0 });
    }

    const userId = payload.uid;

    const unread = await prisma.messageRead.count({
      where: { userId }
    });

    return json({ unread });
  } catch (err) {
    console.error('Unread count error:', err);

    return json({ unread: 0 });
  }
};
