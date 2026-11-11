import type { LayoutServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";
import { redirect } from "@sveltejs/kit";

export const load: LayoutServerLoad = async ({ cookies, params }) => {
  const lang = params.lang ?? "en";
  const token = cookies.get("auth_token");
  if (!token) throw redirect(302, `/${lang}/login`);

  const payload = await verifyJwt(token);
  if (!payload?.uid) throw redirect(302, `/${lang}/login`);

  const [ownedBrands, ownedCommunities, categories] = await Promise.all([
    prisma.brand.findMany({
      where: { ownerId: payload.uid },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        logoUrl: true,
        website: true,
        answers: true,
        categories: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, type: true, title: true } } } },
        _count: { select: { events: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.community.findMany({
      where: { owners: { some: { id: payload.uid } } },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        isPrivate: true,
        createdAt: true,
        _count: { select: { members: true, events: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.eventCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const userInfo = await prisma.cbcUserInfo.findFirst({
    where: { user: { id: payload.uid } },
    select: { role: true },
  });

  const hasRole = ["PARTNER", "RESIDENT", "ADMIN"].includes(userInfo?.role ?? "USER");

  if (!hasRole) {
    throw redirect(302, `/${lang}/events`);
  }

  return {
    userId: payload.uid,
    ownedBrands,
    ownedCommunities,
    categories,
  };
};
