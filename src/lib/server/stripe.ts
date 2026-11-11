import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.warn("Missing STRIPE_SECRET_KEY — Stripe payments will not work");
}

export const stripe = new Stripe(secretKey ?? "");

export async function createCheckoutSession(params: {
  eventId: string;
  userId: string;
  amount: number;
  currency: string;
  eventTitle: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: { name: `Ticket: ${params.eventTitle}` },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      eventId: params.eventId,
      userId: params.userId,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
}
