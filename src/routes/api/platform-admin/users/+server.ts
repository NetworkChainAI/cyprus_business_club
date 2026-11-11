import type { RequestEvent } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";

const VALID_ROLES = ["USER", "PARTNER", "RESIDENT", "ADMIN"] as const;

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const PATCH = async ({ request, cookies }: RequestEvent) => {
  const token = cookies.get("auth_token");
  if (!token) return new Response("Unauthorized", { status: 401 });

  const payload = await verifyJwt(token);
  if (!payload?.uid) return new Response("Unauthorized", { status: 401 });

  // Check that current user is ADMIN
  const currentUser = await prisma.cbcUser.findUnique({
    where: { id: payload.uid },
    include: { info: true },
  });

  if (!currentUser?.info || currentUser.info.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const { userId, role } = await request.json();

  if (!userId || !role) {
    return new Response("userId and role are required", { status: 400 });
  }

  if (!VALID_ROLES.includes(role)) {
    return new Response("Invalid role", { status: 400 });
  }

  if (userId === payload.uid) {
    return new Response("Cannot change your own role", { status: 400 });
  }

  const targetUser = await prisma.cbcUser.findUnique({
    where: { id: userId },
    include: { info: true },
  });

  if (!targetUser?.info) {
    return new Response("User not found", { status: 404 });
  }

  const updated = await prisma.cbcUserInfo.update({
    where: { id: targetUser.info.id },
    data: { role },
    select: { role: true },
  });

  return json({ userId, role: updated.role });
};
