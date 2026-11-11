import type { PageServerLoad } from './$types';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('auth_token');
  let userId: string | null = null;

  if (token) {
    const payload = await verifyJwt(token);
    if (payload?.uid) userId = payload.uid;
  }

  const [categories, eventsRaw, ownedBrandsCount, ownedCommunitiesCount] = await Promise.all([
    prisma.eventCategory.findMany({ orderBy: { name: 'asc' } }),
    prisma.event.findMany({
      where: { isActive: true },
      include: {
        categories: true,
        community: { select: { id: true, name: true, logoUrl: true } },
        brand: { select: { id: true, name: true, logoUrl: true, type: true } },
        _count: { select: { registrations: true } },
        registrations: userId
          ? { where: { userId }, select: { id: true } }
          : false
      },
      orderBy: { createdAt: 'desc' }
    }),
    userId ? prisma.brand.count({ where: { ownerId: userId, status: 'ACTIVE' } }) : 0,
    userId ? prisma.community.count({ where: { owners: { some: { id: userId } } } }) : 0,
  ]);

  const events = eventsRaw.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date,
    createdAt: e.createdAt,
    location: e.location,
    price: e.price,
    photo: e.photo,
    categories: e.categories.map((c) => ({ id: c.id, name: c.name })),
    community: e.community,
    brand: e.brand,
    goingCount: e._count.registrations,
    isRegistered: userId ? (e as any).registrations?.length > 0 : false
  }));

  return {
    categories,
    events,
    userId,
    isOwner: ownedBrandsCount > 0 || ownedCommunitiesCount > 0,
  };
};
