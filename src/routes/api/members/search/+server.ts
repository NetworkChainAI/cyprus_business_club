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

  const users = await prisma.cbcUser.findMany({
    where: {
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { info: { name: { contains: q, mode: 'insensitive' } } }
      ]
    },
    select: {
      id: true,
      email: true,
      info: { select: { name: true, photo: true, status: true } }
    },
    take: 10
  });

  return json(users);
};
