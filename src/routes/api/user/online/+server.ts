import type { RequestHandler } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";

const text = (body: string, status = 200) =>
  new Response(body, { status });

export const POST: RequestHandler = async ({ cookies }) => {
  try {
    const token = cookies.get("auth_token");

    if (!token) return text("OK", 200);

    const payload = await verifyJwt(token);

    if (!payload?.uid) return text("OK", 200);

    await prisma.cbcUser.updateMany({
      where: { id: payload.uid },
      data: { lastOnline: new Date() },
    });

    return text("OK", 200);
  } catch (err) {
    console.error("❌ Error updating lastOnline:", err);

    return text("OK", 200);
  }
};
