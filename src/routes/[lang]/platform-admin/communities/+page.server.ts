import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";

export const load: PageServerLoad = async ({ url }) => {
  const filter = url.searchParams.get("filter") ?? "PENDING";
  const validFilters = ["PENDING", "ACTIVE", "DISABLED"];
  const status = validFilters.includes(filter) ? filter : "PENDING";

  const communities = await prisma.community.findMany({
    where: { status: status as any },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      isPrivate: true,
      status: true,
      createdAt: true,
      owners: {
        select: {
          id: true,
          email: true,
          info: { select: { name: true, photo: true } },
        },
      },
      _count: { select: { members: true, events: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = await Promise.all([
    prisma.community.count({ where: { status: "PENDING" } }),
    prisma.community.count({ where: { status: "ACTIVE" } }),
    prisma.community.count({ where: { status: "DISABLED" } }),
  ]);

  return {
    communities,
    filter: status,
    counts: { PENDING: counts[0], ACTIVE: counts[1], DISABLED: counts[2] },
  };
};
