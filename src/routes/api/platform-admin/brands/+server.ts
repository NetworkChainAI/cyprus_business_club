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

  // Check ADMIN role
  const userInfo = await prisma.cbcUserInfo.findFirst({
    where: { user: { id: payload.uid } },
    select: { role: true },
  });

  if (userInfo?.role !== "ADMIN") {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { brandId, status } = body;

  if (!brandId || !status) {
    return json({ error: "brandId and status are required" }, { status: 400 });
  }

  const validStatuses = ["PENDING", "ACTIVE", "DISABLED"];
  if (!validStatuses.includes(status)) {
    return json({ error: "Invalid status" }, { status: 400 });
  }

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true, status: true, ownerId: true, name: true },
  });
  if (!brand) {
    return json({ error: "Brand not found" }, { status: 404 });
  }

  const updated = await prisma.brand.update({
    where: { id: brandId },
    data: { status: status as any },
    select: { id: true, status: true },
  });

  // Award reputation only on first approval (PENDING → ACTIVE)
  if (status === "ACTIVE" && brand.status !== "ACTIVE" && brand.ownerId) {
    const ownerId = brand.ownerId;

    // +30 Social Capital (deduplicated by refId)
    awardSocialCapital(ownerId, "BRAND_APPROVED", {
      refId: brandId,
      refType: "BRAND",
    }).catch(console.error);

    // +15 Trust Score (create event once, check by note)
    prisma.cbcTrustEvent.findFirst({
      where: { userId: ownerId, action: "BRAND_APPROVED", note: brandId },
    }).then(async (existing) => {
      if (!existing) {
        await prisma.cbcTrustEvent.create({
          data: {
            userId: ownerId,
            action: "BRAND_APPROVED",
            points: TRUST_EVENTS.BRAND_APPROVED,
            note: brandId,
          },
        });
        recalcTrustScore(ownerId).catch(console.error);
      }
    }).catch(console.error);

    // Notify creator
    createNotification({
      userId: ownerId,
      emoji: "✅",
      textKey: `Your brand "${brand.name}" has been approved!`,
      link: `/partners/${brandId}`,
      type: "brand_approved",
    }).catch(console.error);
  }

  return json({ brandId: updated.id, status: updated.status });
};
