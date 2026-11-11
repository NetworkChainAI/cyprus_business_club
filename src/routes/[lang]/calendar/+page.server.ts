import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get("auth_token");

  let userId: string | null = null;

  if (token) {
    try {
      const payload = await verifyJwt(token);
      userId = payload?.uid ?? null;
    } catch {
      userId = null;
    }
  }

  const events = await prisma.event.findMany({
    include: {
      categories: true,
      ...(userId
        ? {
            registrations: {
              where: { userId },
              select: { id: true }
            }
          }
        : {})
    },
    orderBy: { date: "asc" }
  });

  const enrichedEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    price: e.price,
    photo: e.photo,
    documentPath: e.documentPath,
    latitude: e.latitude,
    longitude: e.longitude,
    agenda: e.agenda,
    chatId: e.chatId,
    createdAt: toIso(e.createdAt),
    updatedAt: toIso(e.updatedAt),
    date: toIso(e.date),
    categories: e.categories,
    organizerId: e.organizerId,
    isRegistered: userId ? e.registrations?.length > 0 : false
  }));

  let meetings: any[] = [];

  if (userId) {
    const dbMeetings = await prisma.meeting.findMany({
      where: {
        OR: [{ clientId: userId }, { hostId: userId }]
      },
      include: {
        slot: true,
        host: { include: { info: true } },
        client: { include: { info: true } }
      },
      orderBy: {
        slot: { start: "asc" }
      }
    });

    meetings = dbMeetings.map((m) => ({
      id: m.id,
      start: toIso(m.slot.start),
      end: toIso(m.slot.end),
      host: {
        id: m.host.id,
        email: m.host.email,
        name: m.host.info?.name ?? null,
        photo: m.host.info?.photo ?? "/assets/images/user-male-circle.jpg"
      },
      client: {
        id: m.client.id,
        email: m.client.email,
        name: m.client.info?.name ?? null,
        photo: m.client.info?.photo ?? "/assets/images/user-male-circle.jpg"
      }
    }));
  }

  return {
    currentUserId: userId,
    events: enrichedEvents,
    meetings,
    error: null
  };
};
