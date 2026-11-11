import type { PageServerLoad } from './$types';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = cookies.get('auth_token');
  let userId: string | null = null;

  if (token) {
    const payload = await verifyJwt(token);
    if (payload?.uid) userId = payload.uid;
  }

  const community = await prisma.community.findUnique({
    where: { name: decodeURIComponent(params.name) },
    include: {
      owners: {
        select: {
          id: true,
          info: { select: { name: true, photo: true, status: true } },
        },
      },
      members: {
        select: {
          id: true,
          info: { select: { name: true, photo: true, status: true } },
        },
        take: 20,
      },
      _count: { select: { members: true } },
    },
  });

  if (!community) throw error(404, 'Community not found');

  const isOwner = userId
    ? community.owners.some((o) => o.id === userId)
    : false;

  const isMember = userId
    ? community.members.some((m) => m.id === userId) || isOwner
    : false;

  let hasPendingRequest = false;
  let requestDate: string | null = null;

  if (userId && !isMember) {
    const req = await prisma.communityJoinRequest.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (req) {
      hasPendingRequest = true;
      requestDate = req.createdAt.toISOString();
    }
  }

  // Load join requests for owners
  let joinRequests: any[] = [];
  if (isOwner) {
    const raw = await prisma.communityJoinRequest.findMany({
      where: { communityId: community.id },
      include: {
        user: {
          select: {
            id: true,
            info: { select: { name: true, photo: true, status: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    joinRequests = raw.map((r) => ({
      id: r.id,
      message: r.message,
      createdAt: r.createdAt,
      user: {
        id: r.user.id,
        name: r.user.info?.name ?? 'Unknown',
        photo: r.user.info?.photo ?? null,
        status: r.user.info?.status ?? 'Member',
      },
    }));
  }

  return {
    community: {
      id: community.id,
      name: community.name,
      logoUrl: community.logoUrl,
      isPrivate: community.isPrivate,
      createdAt: community.createdAt,
      memberCount: community._count.members,
      address: community.address as { country?: string; city?: string; street?: string; full?: string } | null,
      lat: community.lat,
      lng: community.lng,
      owners: community.owners.map((o) => ({
        id: o.id,
        name: o.info?.name ?? 'Unknown',
        photo: o.info?.photo ?? null,
        status: o.info?.status ?? 'Member',
      })),
      members: community.members.map((m) => ({
        id: m.id,
        name: m.info?.name ?? 'Unknown',
        photo: m.info?.photo ?? null,
        status: m.info?.status ?? 'Member',
      })),
    },
    userId,
    isOwner,
    isMember,
    hasPendingRequest,
    requestDate,
    joinRequests,
  };
};
