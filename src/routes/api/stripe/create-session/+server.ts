import type { RequestHandler } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";
import { createCheckoutSession } from "$lib/server/stripe";

export const POST: RequestHandler = async ({ request, cookies, url }) => {
  const token = cookies.get("auth_token");
  if (!token) return new Response("Unauthorized", { status: 401 });

  const payload = await verifyJwt(token);
  if (!payload?.uid) return new Response("Invalid token", { status: 401 });

  const { eventId } = await request.json();
  if (!eventId) return new Response("Missing eventId", { status: 400 });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return new Response("Event not found", { status: 404 });

  if (new Date(event.date) < new Date()) {
    return new Response(JSON.stringify({ error: "This event has already ended" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const price = event.price ?? 0;
  if (price <= 0) {
    return new Response(JSON.stringify({ free: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const origin = url.origin;

  const session = await createCheckoutSession({
    eventId,
    userId: payload.uid,
    amount: price,
    currency: "EUR",
    eventTitle: event.title,
    successUrl: `${origin}/events/${eventId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/events/${eventId}?payment=cancel`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
