import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params, parent }) => {
  const { userId } = await parent();

  const brand = await prisma.brand.findUnique({
    where: { id: params.id },
    include: {
      categories: { select: { id: true, name: true } },
      tags: { include: { tag: { select: { id: true, type: true, title: true } } } },
    },
  });

  if (!brand) throw redirect(302, "/admin/brands");
  if (brand.ownerId !== userId) throw redirect(302, "/admin/brands");

  return { editBrand: brand };
};
