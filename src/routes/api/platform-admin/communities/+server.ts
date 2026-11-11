import type { RequestHandler } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";
import { json } from "@sveltejs/kit";
import { awardSocialCapital, recalcTrustScore } from "$lib/reputation";
import { TRUST_EVENTS } from "$lib/reputation/config";
import { createNotification } from "$lib/services/notifications";

export const PATCH: RequestHandler = async ({ cookies, request }) => {
  const token = cookies.get("auth_token");
  if (!token) return json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyJwt(token);
  if (!payload?.uid) return json({ error: "Invalid token" }, { status: 401 });

  const userInfo = await prisma.cbcUserInfo.findFirst({
    where: { user: { id: payload.uid } },
    select: { role: true },
  });

  if (userInfo?.role !== "ADMIN") {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { communityId, status } = body;

  if (!communityId || !status) {
    return json({ error: "communityId and status are required" }, { status: 400 });
  }

  const validStatuses = ["PENDING", "ACTIVE", "DISABLED"];
  if (!validStatuses.includes(status)) {
    return json({ error: "Invalid status" }, { status: 400 });
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true, status: true, name: true, owners: { select: { id: true } } },
  });
  if (!community) {
    return json({ error: "Community not found" }, { status: 404 });
  }

  const updated = await prisma.community.update({
    where: { id: communityId },
    data: { status: status as any },
    select: { id: true, status: true },
  });

  // Award reputation only on first approval (PENDING → ACTIVE)
  if (status === "ACTIVE" && community.status !== "ACTIVE") {
    for (const owner of community.owners) {
      const ownerId = owner.id;

      // +30 Social Capital (deduplicated by refId)
      awardSocialCapital(ownerId, "COMMUNITY_APPROVED", {
        refId: communityId,
        refType: "COMMUNITY",
      }).catch(console.error);

      // +15 Trust Score (create event once, check by note)
      prisma.cbcTrustEvent.findFirst({
        where: { userId: ownerId, action: "COMMUNITY_APPROVED", note: communityId },
      }).then(async (existing) => {
        if (!existing) {
          await prisma.cbcTrustEvent.create({
            data: {
              userId: ownerId,
              action: "COMMUNITY_APPROVED",
              points: TRUST_EVENTS.COMMUNITY_APPROVED,
              note: communityId,
            },
          });
          recalcTrustScore(ownerId).catch(console.error);
        }
      }).catch(console.error);

      // Notify each owner
      createNotification({
        userId: ownerId,
        emoji: "✅",
        textKey: `Your community "${community.name}" has been approved!`,
        link: `/communities/${communityId}`,
        type: "community_approved",
      }).catch(console.error);
    }
  }

  return json({ communityId: updated.id, status: updated.status });
};
