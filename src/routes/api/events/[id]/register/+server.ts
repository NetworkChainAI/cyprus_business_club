import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';
import { createNotification } from '$lib/services/notifications';
import { awardSocialCapital } from '$lib/reputation';

export const POST = async ({ cookies, params }: RequestEvent) => {
  try {
    const token = cookies.get('auth_token');
    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload?.uid) {
      return new Response('Invalid token', { status: 401 });
    }

    const eventId = params.id;
    if (!eventId) {
      return new Response('Missing event id', { status: 400 });
    }

    const userId = payload.uid;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          include: { info: true }
        }
      }
    });

    if (!event) {
      return new Response('Event not found', { status: 404 });
    }

    if (new Date(event.date) < new Date()) {
      return new Response(JSON.stringify({ error: 'This event has already ended' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const existing = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId
        }
      }
    });

    if (existing) {
      if (event.chatId) {
        await prisma.chatParticipant.upsert({
          where: { userId_chatId: { userId, chatId: event.chatId } },
          update: {},
          create: { userId, chatId: event.chatId, role: "member" }
        });
      }

      return new Response(
        JSON.stringify({ message: 'Already registered', registrationId: existing.id }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const reg = await prisma.$transaction(async (tx) => {
      const created = await tx.eventRegistration.create({
        data: { userId, eventId }
      });

      if (event.chatId) {
        await tx.chatParticipant.upsert({
          where: { userId_chatId: { userId, chatId: event.chatId } },
          update: {},
          create: { userId, chatId: event.chatId, role: "member" }
        });
      }

      return created;
    });

    await createNotification({
      userId,
      emoji: "📅",
      textKey: `You successfully registered for the event "${event.title}"`,
      link: `/events/${eventId}`,
      type: "event_registration"
    });

    if (event.organizerId && event.organizerId !== userId) {
      const participant = await prisma.cbcUser.findUnique({
        where: { id: userId },
        include: { info: true }
      });

      const participantName =
        participant?.info?.name || participant?.email || "New User";

      await createNotification({
        userId: event.organizerId,
        emoji: "🙋‍♂️",
        textKey: `${participantName} registered for your event "${event.title}"`,
        link: `/events/${eventId}`,
        type: "new_participant"
      });
    }

    // Reputation: +5 SC to organizer for each registration
    if (event.organizerId && event.organizerId !== userId) {
      awardSocialCapital(event.organizerId, "EVENT_REGISTRATION_RECEIVED", {
        refId: `${eventId}_${userId}`,
        refType: "EVENT",
      }).catch(console.error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        registrationId: reg.id,
        chatId: event.chatId ?? null
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('Event register error:', err);

    if (err.code === 'P2002') {
      return new Response(
        JSON.stringify({ message: 'Already registered' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Internal server error', { status: 500 });
  }
};
