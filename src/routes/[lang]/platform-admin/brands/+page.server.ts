import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";

export const load: PageServerLoad = async ({ url }) => {
  const filter = url.searchParams.get("filter") ?? "PENDING";
  const validFilters = ["PENDING", "ACTIVE", "DISABLED"];
  const status = validFilters.includes(filter) ? filter : "PENDING";

  const brands = await prisma.brand.findMany({
    where: { status: status as any },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      logoUrl: true,
      website: true,
      answers: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          email: true,
          info: { select: { name: true, photo: true } },
        },
      },
      categories: { select: { id: true, name: true } },
      _count: { select: { events: true, followers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = await Promise.all([
    prisma.brand.count({ where: { status: "PENDING" } }),
    prisma.brand.count({ where: { status: "ACTIVE" } }),
    prisma.brand.count({ where: { status: "DISABLED" } }),
  ]);

  return {
    brands,
    filter: status,
    counts: { PENDING: counts[0], ACTIVE: counts[1], DISABLED: counts[2] },
  };
};
