import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";

export const load: PageServerLoad = async () => {
  const categories = await prisma.eventCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { events: true, brands: true } },
    },
  });

  return {
    allCategories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      eventsCount: c._count.events,
      brandsCount: c._count.brands,
    })),
  };
};
