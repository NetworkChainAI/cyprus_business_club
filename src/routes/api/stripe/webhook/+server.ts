import type { RequestHandler } from "@sveltejs/kit";
import { stripe } from "$lib/server/stripe";
import { registerAfterPayment } from "$lib/server/registerAfterPayment";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { eventId, userId } = session.metadata ?? {};

    if (!eventId || !userId) {
      console.error("Stripe webhook: missing metadata", session.metadata);
      return new Response("OK", { status: 200 });
    }

    const result = await registerAfterPayment({
      userId,
      eventId,
      provider: "STRIPE",
      providerPaymentId: session.id,
      amountPaid: (session.amount_total ?? 0) / 100,
      currency: (session.currency ?? "eur"),
      rawDetails: {
        eventId,
        stripeSession: {
          id: session.id,
          payment_intent: session.payment_intent,
          payment_status: session.payment_status,
          amount_total: session.amount_total,
          currency: session.currency,
        },
      },
    });

    console.log("Stripe webhook: registration", result ? "created" : "already exists");
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
