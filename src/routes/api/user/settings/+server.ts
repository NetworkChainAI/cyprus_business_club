import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = cookies.get('auth_token');
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyJwt(token);
  if (!payload?.uid) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { isPrivate, emailSend, chatBotSend } = body;

  const data: Record<string, boolean> = {};
  if (typeof isPrivate === 'boolean') data.isPrivate = isPrivate;
  if (typeof emailSend === 'boolean') data.emailSend = emailSend;
  if (typeof chatBotSend === 'boolean') data.chatBotSend = chatBotSend;

  if (Object.keys(data).length === 0) {
    return json({ error: 'No settings to update' }, { status: 400 });
  }

  const settings = await prisma.cbcUserSetting.upsert({
    where: { userId: payload.uid },
    create: { userId: payload.uid, ...data },
    update: data,
  });

  return json({ ok: true, settings });
};
