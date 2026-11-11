import type { RequestHandler } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";
import { createPaypalOrder } from "$lib/server/paypal";

export const POST: RequestHandler = async ({ request, cookies }) => {
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

  const orderRes = await createPaypalOrder(price, "EUR");
  console.log("🟡 PAYPAL CREATE ORDER:", orderRes.json);

  if (!orderRes.ok) {
    return new Response(
      `PayPal create order failed (${orderRes.status}): ${JSON.stringify(orderRes.json)}`,
      { status: 502 }
    );
  }

  const paypalOrderId = orderRes.json?.id;
  if (!paypalOrderId) return new Response("Missing paypal order id", { status: 502 });

  return new Response(JSON.stringify({ paypalOrderId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
