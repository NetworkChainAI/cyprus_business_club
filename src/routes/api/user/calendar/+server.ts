import type { RequestHandler } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const token = cookies.get("auth_token");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const payload = await verifyJwt(token);
    const userId = payload?.uid;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const events = await prisma.event.findMany({
      include: {
        categories: true,
        registrations: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: { date: "asc" },
    });

    const enrichedEvents = events.map((e) => ({
      ...e,
      isRegistered: e.registrations.length > 0,
    }));

    const meetings = await prisma.meeting.findMany({
      where: {
        OR: [{ clientId: userId }, { hostId: userId }],
      },
      include: {
        slot: true,
        host: { include: { info: true } },
        client: { include: { info: true } },
      },
      orderBy: {
        slot: { start: "asc" },
      },
    });

    const formattedMeetings = meetings.map((m) => ({
      id: m.id,
      start: m.slot.start,
      end: m.slot.end,
      host: {
        id: m.host.id,
        email: m.host.email,
        name: m.host.info?.name ?? null,
        photo: m.host.info?.photo ?? "/assets/images/user-male-circle.jpg",
      },
      client: {
        id: m.client.id,
        email: m.client.email,
        name: m.client.info?.name ?? null,
        photo: m.client.info?.photo ?? "/assets/images/user-male-circle.jpg",
      },
    }));

    return new Response(
      JSON.stringify({
        events: enrichedEvents,
        meetings: formattedMeetings,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Error in /api/user/calendar:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
