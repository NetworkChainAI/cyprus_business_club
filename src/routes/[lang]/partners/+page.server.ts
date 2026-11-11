import type { PageServerLoad } from './$types';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('auth_token');
  let currentUserId: string | null = null;

  if (token) {
    const payload = await verifyJwt(token).catch(() => null);
    if (payload?.uid) currentUserId = payload.uid;
  }
  const brands = await prisma.brand.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      type: true,
      website: true,
      answers: true,
      categories: { select: { id: true, name: true } },
      owner: {
        select: {
          id: true,
          info: { select: { name: true, photo: true } },
        },
      },
      _count: { select: { followers: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const enriched = brands.map((b) => {
    const ans = (b.answers as any) ?? {};
    return {
      id: b.id,
      name: b.name,
      logoUrl: b.logoUrl,
      type: b.type,
      website: b.website,
      description: ans.about?.description ?? null,
      categories: b.categories,
      owner: {
        id: b.owner.id,
        name: b.owner.info?.name ?? null,
        photo: b.owner.info?.photo ?? null,
      },
      followersCount: b._count.followers,
      createdAt: b.createdAt.toISOString(),
    };
  });

  const categories = await prisma.eventCategory.findMany({
    where: {
      brands: { some: { status: 'ACTIVE' } },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  let followedBrandIds: string[] = [];
  if (currentUserId) {
    const follows = await prisma.brandFollow.findMany({
      where: { userId: currentUserId },
      select: { brandId: true },
    });
    followedBrandIds = follows.map((f) => f.brandId);
  }

  return { brands: enriched, categories, currentUserId, followedBrandIds };
};
