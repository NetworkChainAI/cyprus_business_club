import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ cookies, params }) => {
  const lang = params.lang ?? "en";
  const token = cookies.get("auth_token");
  if (!token) throw redirect(302, `/${lang}/login`);

  const payload = await verifyJwt(token);
  if (!payload?.uid) throw redirect(302, `/${lang}/login`);

  const [ownedBrands, ownedCommunities, categories] = await Promise.all([
    prisma.brand.findMany({
      where: { ownerId: payload.uid, status: "ACTIVE" },
      select: { id: true, name: true, type: true, logoUrl: true },
    }),
    prisma.community.findMany({
      where: { owners: { some: { id: payload.uid } } },
      select: { id: true, name: true, logoUrl: true },
    }),
    prisma.eventCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (ownedBrands.length === 0 && ownedCommunities.length === 0) {
    throw redirect(302, `/${lang}/events`);
  }

  return {
    ownedBrands,
    ownedCommunities,
    categories,
  };
};
