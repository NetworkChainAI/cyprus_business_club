import prisma from "$lib/prisma";
import { TRUST_STATIC, TRUST_MIN, TRUST_MAX, TRUST_MULTIPLIERS } from "./config";

/**
 * Recalculate Trust Score for a user from scratch.
 * Checks: photo (+5), phone (+5), custody (+5), speaker (+15)
 * plus sum of CbcTrustEvent points (KYC, complaints, etc.).
 * Idempotent — safe to call multiple times.
 */
export async function recalcTrustScore(userId: string): Promise<number> {
  const user = await prisma.cbcUser.findUnique({
    where: { id: userId },
    select: {
      info: {
        select: {
          id: true,
          photo: true,
          phoneNumber: true,
          custodyAddress: true,
        },
      },
      speakerAt: { select: { id: true }, take: 1 },
    },
  });

  if (!user || !user.info) return 0;

  let score = 0;
  if (user.info.photo) score += TRUST_STATIC.HAS_PHOTO;
  if (user.info.phoneNumber) score += TRUST_STATIC.HAS_PHONE;
  if (user.info.custodyAddress) score += TRUST_STATIC.HAS_CUSTODY;
  if (user.speakerAt.length > 0) score += TRUST_STATIC.IS_SPEAKER;

  // Dynamic events (KYC, complaints, etc.)
  const eventsSum = await prisma.cbcTrustEvent.aggregate({
    where: { userId },
    _sum: { points: true },
  });
  score += eventsSum._sum.points ?? 0;

  score = Math.max(TRUST_MIN, Math.min(TRUST_MAX, score));

  await prisma.cbcUserInfo.update({
    where: { id: user.info.id },
    data: { trustScore: score },
  });

  return score;
}

/**
 * Get the trust-based multiplier for a user.
 */
export function getTrustMultiplier(trustScore: number): number {
  for (const tier of TRUST_MULTIPLIERS) {
    if (trustScore >= tier.min && trustScore <= tier.max) {
      return tier.multiplier;
    }
  }
  return 1.0;
}
