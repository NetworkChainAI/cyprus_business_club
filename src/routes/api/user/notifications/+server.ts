import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export const GET = async ({ cookies, url }: RequestEvent) => {
  try {
    const token = cookies.get('auth_token');

    if (!token) {
      return json({ notifications: [] });
    }

    const payload = await verifyJwt(token);

    if (!payload?.uid) {
      return json({ notifications: [] });
    }

    const unreadOnly = url.searchParams.get('unread') === 'true';

    const notifications = await prisma.notification.findMany({
      where: {
        userId: payload.uid,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      ...(unreadOnly ? {} : { take: 50 }),
    });

    return json({ notifications });
  } catch (err) {
    console.error('Notifications GET error:', err);

    return json({ notifications: [] });
  }
};

export const POST = async ({ cookies, request }: RequestEvent) => {
  try {
    const token = cookies.get('auth_token');

    if (!token) {
      return json({ ok: false });
    }

    const payload = await verifyJwt(token);
    if (!payload?.uid) {
      return json({ ok: false });
    }

    const { id } = await request.json();
    if (!id) return json({ ok: false });

    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return json({ ok: true });
  } catch (err) {
    console.error('Notifications POST error:', err);
    return json({ ok: false });
  }
};
