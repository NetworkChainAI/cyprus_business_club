import prisma from "$lib/prisma";
import { SC_ACTIONS, SC_RANKS } from "./config";

type ActionKey = keyof typeof SC_ACTIONS;

interface AwardOptions {
  sourceUserId?: string;
  refId?: string;
  refType?: string;
}

/**
 * Award Social Capital to a user.
 * Deduplication by recipientId + action + refId (+ sourceUserId if present).
 */
export async function awardSocialCapital(
  recipientId: string,
  action: ActionKey,
  opts: AwardOptions = {}
): Promise<{ awarded: boolean; points: number; reason?: string }> {
  const points: number = SC_ACTIONS[action];

  // Deduplication
  if (opts.refId) {
    const exists = await prisma.cbcSocialLedger.findFirst({
      where: {
        recipientId,
        action,
        refId: opts.refId,
        ...(opts.sourceUserId ? { sourceUserId: opts.sourceUserId } : {}),
      },
      select: { id: true },
    });
    if (exists) return { awarded: false, points: 0, reason: "duplicate" };
  }

  await prisma.cbcSocialLedger.create({
    data: {
      recipientId,
      sourceUserId: opts.sourceUserId ?? null,
      action,
      points,
      refId: opts.refId ?? null,
      refType: opts.refType ?? null,
    },
  });

  await updateSocialTotal(recipientId);

  return { awarded: true, points };
}

/**
 * Recalculate total from ledger and update CbcSocialTotal.
 */
export async function updateSocialTotal(userId: string): Promise<{ total: number; rank: string }> {
  const sum = await prisma.cbcSocialLedger.aggregate({
    where: { recipientId: userId },
    _sum: { points: true },
  });

  const total = Math.max(0, sum._sum.points ?? 0);
  const rank = getRank(total);

  await prisma.cbcSocialTotal.upsert({
    where: { userId },
    create: { userId, total, rank },
    update: { total, rank },
  });

  return { total, rank };
}

export function getRank(total: number): string {
  for (const r of SC_RANKS) {
    if (total >= r.min && total <= r.max) return r.name;
  }
  return "Explorer";
}

export async function getSocialCapital(userId: string): Promise<{ total: number; rank: string }> {
  const row = await prisma.cbcSocialTotal.findUnique({
    where: { userId },
    select: { total: true, rank: true },
  });
  return row ?? { total: 0, rank: "Explorer" };
}
