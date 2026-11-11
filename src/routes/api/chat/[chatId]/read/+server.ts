import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';

export const POST = async ({ params, cookies }: RequestEvent) => {
  try {
    const chatId = params.chatId;

    const token = cookies.get('auth_token');
    if (!token) return new Response('Unauthorized', { status: 401 });

    const payload = await verifyJwt(token);
    const userId = payload?.uid;
    if (!userId) return new Response('Invalid token', { status: 401 });

    // Verify user is a participant of this chat
    const participant = await prisma.chatParticipant.findUnique({
      where: { userId_chatId: { userId, chatId: chatId! } },
    });
    if (!participant) return new Response('Forbidden: not a chat participant', { status: 403 });

    // Find all unread messages in this chat sent by others
    const unread = await prisma.message.findMany({
      where: {
        chatId,
        senderId: { not: userId },
        reads: { none: { userId } },
      },
      select: { id: true },
    });

    if (unread.length > 0) {
      await prisma.messageRead.createMany({
        data: unread.map(m => ({ messageId: m.id, userId })),
        skipDuplicates: true,
      });
    }

    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('Message read error:', err);
    return new Response('Internal server error', { status: 500 });
  }
};
