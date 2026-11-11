import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = cookies.get('auth_token');
  let currentUserId: string | null = null;

  if (token) {
    const payload = await verifyJwt(token).catch(() => null);
    if (payload?.uid) currentUserId = payload.uid;
  }

  const brand = await prisma.brand.findUnique({
    where: { id: params.id },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          info: {
            select: {
              name: true,
              photo: true,
              location: true,
              status: true,
              bio: true,
            },
          },
        },
      },
      categories: {
        select: { id: true, name: true },
      },
      tags: {
        include: {
          tag: { select: { id: true, type: true, title: true } },
        },
      },
      _count: {
        select: { followers: true },
      },
    },
  });

  if (!brand) {
    throw error(404, 'Partner not found');
  }

  let isFollowing = false;
  if (currentUserId && currentUserId !== brand.ownerId) {
    const follow = await prisma.brandFollow.findUnique({
      where: {
        userId_brandId: {
          userId: currentUserId,
          brandId: brand.id,
        },
      },
      select: { id: true },
    });
    isFollowing = !!follow;
  }

  return {
    brand,
    followersCount: brand._count.followers,
    isFollowing,
    currentUserId,
  };
};
