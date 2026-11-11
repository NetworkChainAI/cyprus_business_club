import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/prisma';

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export const GET = async ({ url }: RequestEvent) => {
  const q = url.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return json([]);
  }

  const brands = await prisma.brand.findMany({
    where: {
      status: 'ACTIVE',
      name: { contains: q, mode: 'insensitive' }
    },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      type: true
    },
    take: 10,
    orderBy: { name: 'asc' }
  });

  return json(brands);
};
