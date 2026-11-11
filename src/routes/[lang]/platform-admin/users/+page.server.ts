import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ url }) => {
  const q = url.searchParams.get("q")?.trim() ?? "";
  const pageNum = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);

  const where = q.length >= 2
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { info: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.cbcUser.findMany({
      where,
      select: {
        id: true,
        email: true,
        createdAt: true,
        lastOnline: true,
        info: {
          select: {
            name: true,
            photo: true,
            status: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.cbcUser.count({ where }),
  ]);

  return {
    users,
    total,
    page: pageNum,
    pageSize: PAGE_SIZE,
    q,
  };
};
