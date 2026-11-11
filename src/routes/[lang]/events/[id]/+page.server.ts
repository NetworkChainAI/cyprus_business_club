import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { stripe } from "$lib/server/stripe";
import { registerAfterPayment } from "$lib/server/registerAfterPayment";

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const { id } = params;
  if (!id) {
    return { status: 400, error: "Event ID is required" };
  }

  // Stripe fallback: verify payment on redirect if webhook hasn't fired yet
  const sessionId = url.searchParams.get("session_id");
  const paymentStatus = url.searchParams.get("payment");
  if (sessionId && paymentStatus === "success" && locals.user) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (
        session.payment_status === "paid" &&
        session.metadata?.eventId === id &&
        session.metadata?.userId === locals.user.id
      ) {
        await registerAfterPayment({
          userId: locals.user.id,
          eventId: id,
          provider: "STRIPE",
          providerPaymentId: session.id,
          amountPaid: (session.amount_total ?? 0) / 100,
          currency: session.currency ?? "eur",
          rawDetails: {
            eventId: id,
            stripeSession: {
              id: session.id,
              payment_intent: session.payment_intent,
              payment_status: session.payment_status,
              amount_total: session.amount_total,
              currency: session.currency,
            },
            source: "redirect_fallback",
          },
        });
      }
    } catch (err) {
      console.error("Stripe fallback verification failed:", err);
    }
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      categories: true,
      organizer: { include: { info: true } },
      community: { select: { id: true, name: true, logoUrl: true } },
      brand: { select: { id: true, name: true, logoUrl: true, type: true } },
      registrations: {
        include: { user: { include: { info: true } } },
        orderBy: { createdAt: "desc" },
      },
      sponsors: {
        include: { brand: { select: { id: true, name: true, logoUrl: true } } },
        orderBy: { order: "asc" },
      },
      speakers: {
        include: { user: { include: { info: { select: { name: true, photo: true, status: true } } } } },
        orderBy: { order: "asc" },
      },
      _count: { select: { registrations: true } },
    },
  });

  if (!event) {
    return { status: 404, error: "Event not found" };
  }

  let isRegistered = false;
  if (locals.user) {
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: { userId: locals.user.id, eventId: id },
      },
    });
    isRegistered = Boolean(registration);
  }

  let custodyAddress: string | null = null;
  if (locals.user) {
    const info = await prisma.cbcUserInfo.findFirst({
      where: { user: { id: locals.user.id } },
      select: { custodyAddress: true },
    });
    custodyAddress = info?.custodyAddress ?? null;
  }

  const attendees = event.registrations.map((r) => r.user);
  const attendeesCount = event._count.registrations;

  const firstCategoryId = event.categories?.[0]?.id;

  const similarEvents = await prisma.event.findMany({
    where: {
      id: { not: id },
      ...(firstCategoryId
        ? { categories: { some: { id: firstCategoryId } } }
        : {}),
    },
    include: {
      categories: true,
    },
    orderBy: { date: "asc" },
    take: 6,
  });

  return {
    event,
    attendees,
    attendeesCount,
    isRegistered,
    chatId: event.chatId ?? null,
    similarEvents,
    userId: locals.user?.id ?? null,
    custodyAddress,
  };
};
