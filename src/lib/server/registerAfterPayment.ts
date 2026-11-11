import prisma from "$lib/prisma";
import { createNotification } from "$lib/services/notifications";
import { awardSocialCapital } from "$lib/reputation";

/**
 * Creates transaction + event registration after a successful payment.
 * Used by both Stripe webhook and fallback verification on redirect.
 * Returns null if already processed (idempotent).
 */
export async function registerAfterPayment(params: {
  userId: string;
  eventId: string;
  provider: "STRIPE" | "PAYPAL" | "CRYPTO";
  providerPaymentId: string;
  amountPaid: number;
  currency: string;
  rawDetails: Record<string, any>;
}) {
  const { userId, eventId, provider, providerPaymentId, amountPaid, currency, rawDetails } = params;

  // Idempotency: check if already processed
  const existingTx = await prisma.cbcTransaction.findFirst({
    where: { userId, provider, providerPaymentId, status: "CAPTURED" },
  });
  if (existingTx) return null;

  const dbEvent = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: { include: { info: true } } },
  });
  if (!dbEvent) {
    console.error(`registerAfterPayment: event not found ${eventId}`);
    return null;
  }

  const price = dbEvent.price ?? 0;

  const out = await prisma.$transaction(async (p) => {
    const tx = await p.cbcTransaction.create({
      data: {
        userId,
        type: "EVENT_REGISTRATION",
        provider,
        status: "CAPTURED",
        amount: amountPaid || price,
        currency: currency.toUpperCase(),
        providerPaymentId,
        rawDetails,
      },
    });

    const reg = await p.eventRegistration.upsert({
      where: { userId_eventId: { userId, eventId } },
      update: { transactionId: tx.id },
      create: { userId, eventId, transactionId: tx.id },
    });

    if (dbEvent.chatId) {
      await p.chatParticipant.upsert({
        where: { userId_chatId: { userId, chatId: dbEvent.chatId } },
        update: {},
        create: { userId, chatId: dbEvent.chatId, role: "member" },
      });
    }

    return { txId: tx.id, registrationId: reg.id };
  });

  // Notifications (fire-and-forget)
  createNotification({
    userId,
    emoji: "📅",
    textKey: `You successfully registered for the event "${dbEvent.title}"`,
    link: `/events/${eventId}`,
    type: "event_registration",
  }).catch(console.error);

  if (dbEvent.organizerId && dbEvent.organizerId !== userId) {
    const participant = await prisma.cbcUser.findUnique({
      where: { id: userId },
      include: { info: true },
    });
    const participantName = participant?.info?.name || participant?.email || "New User";

    createNotification({
      userId: dbEvent.organizerId,
      emoji: "🙋‍♂️",
      textKey: `${participantName} registered for your event "${dbEvent.title}"`,
      link: `/events/${eventId}`,
      type: "new_participant",
    }).catch(console.error);

    awardSocialCapital(dbEvent.organizerId, "EVENT_REGISTRATION_RECEIVED", {
      refId: `${eventId}_${userId}`,
      refType: "EVENT",
    }).catch(console.error);
  }

  return out;
}
