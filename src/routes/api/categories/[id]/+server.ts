import type { RequestHandler } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  const token = cookies.get("auth_token");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const payload = await verifyJwt(token);
  if (!payload?.uid) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing category ID" }), { status: 400 });
  }

  const category = await prisma.eventCategory.findUnique({
    where: { id },
    include: {
      _count: { select: { events: true, brands: true } },
    },
  });

  if (!category) {
    return new Response(JSON.stringify({ error: "Category not found" }), { status: 404 });
  }

  if (category._count.events > 0 || category._count.brands > 0) {
    return new Response(
      JSON.stringify({
        error: `Cannot delete: used by ${category._count.events} events and ${category._count.brands} brands`,
      }),
      { status: 409 }
    );
  }

  await prisma.eventCategory.delete({ where: { id } });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
