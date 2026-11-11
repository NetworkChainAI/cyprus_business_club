import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';

export const POST = async ({ cookies, request }: RequestEvent) => {
  try {
    const token = cookies.get('auth_token');
    if (!token) return new Response('Unauthorized', { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload?.uid) return new Response('Invalid token', { status: 401 });

    const { userId: targetUserId } = await request.json();
    if (!targetUserId) return new Response('Missing userId', { status: 400 });

    if (payload.uid === targetUserId) {
      return new Response("You can't create chat with yourself", { status: 400 });
    }

    const userId = payload.uid;

    const existing = await prisma.chat.findFirst({
      where: {
        participants: {
          every: {
            userId: { in: [userId, targetUserId] }
          }
        }
      },
      include: {
        participants: true
      }
    });

    if (existing) {
      return new Response(
        JSON.stringify({ chatId: existing.id }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const chat = await prisma.chat.create({
      data: {
        participants: {
          create: [
            { userId },
            { userId: targetUserId }
          ]
        }
      }
    });

    return new Response(
      JSON.stringify({ chatId: chat.id }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Chat create error:', err);
    return new Response('Internal server error', { status: 500 });
  }
};
