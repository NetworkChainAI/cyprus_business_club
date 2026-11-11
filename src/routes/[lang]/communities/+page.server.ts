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

  const [raw, pendingRequests] = await Promise.all([
    prisma.community.findMany({
      where: { status: "ACTIVE" },
      include: {
        owners: { select: { id: true, info: { select: { name: true, photo: true } } } },
        _count: { select: { members: true, posts: true } },
        ...(userId
          ? { members: { where: { id: userId }, select: { id: true } } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    }),
    userId
      ? prisma.communityJoinRequest.findMany({
          where: { userId },
          select: { communityId: true },
        })
      : Promise.resolve([]),
  ]);

  const pendingSet = new Set(pendingRequests.map((r) => r.communityId));

  const communities = raw.map((c) => ({
    id: c.id,
    name: c.name,
    logoUrl: c.logoUrl,
    isPrivate: c.isPrivate,
    createdAt: c.createdAt,
    memberCount: c._count.members,
    postCount: c._count.posts,
    owners: c.owners.map((o) => ({
      id: o.id,
      name: o.info?.name ?? 'Unknown',
      photo: o.info?.photo ?? null,
    })),
    isMember: userId ? (c as any).members?.length > 0 : false,
    isPending: pendingSet.has(c.id),
    address: c.address as { country?: string; city?: string; street?: string; full?: string } | null,
    lat: c.lat,
    lng: c.lng,
  }));

  const countries = [...new Set(
    communities
      .map((c) => c.address?.country)
      .filter((v): v is string => !!v)
  )].sort();

  return { communities, userId, countries };
};
