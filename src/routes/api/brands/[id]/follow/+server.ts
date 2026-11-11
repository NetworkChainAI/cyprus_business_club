import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';
import { createNotification } from '$lib/services/notifications';

export const GET = async ({ params, cookies }: RequestEvent) => {
  try {
    const token = cookies.get('auth_token');
    if (!token) return new Response(JSON.stringify({ following: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const payload = await verifyJwt(token);
    if (!payload?.uid) return new Response(JSON.stringify({ following: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const brandId = params.id;
    if (!brandId) return new Response('Missing brand id', { status: 400 });

    const follow = await prisma.brandFollow.findUnique({
      where: {
        userId_brandId: {
          userId: payload.uid,
          brandId,
        },
      },
    });

    return new Response(JSON.stringify({ following: !!follow }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Brand follow status error:', err);
    return new Response('Internal server error', { status: 500 });
  }
};

export const POST = async ({ params, cookies }: RequestEvent) => {
  try {
    const token = cookies.get('auth_token');
    if (!token) return new Response('Unauthorized', { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload?.uid) return new Response('Invalid token', { status: 401 });

    const brandId = params.id;
    if (!brandId) return new Response('Missing brand id', { status: 400 });

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { ownerId: true, name: true },
    });

    if (!brand) return new Response('Brand not found', { status: 404 });

    if (brand.ownerId === payload.uid) {
      return new Response('Cannot follow your own brand', { status: 400 });
    }

    const existing = await prisma.brandFollow.findUnique({
      where: {
        userId_brandId: {
          userId: payload.uid,
          brandId,
        },
      },
    });

    if (existing) {
      return new Response('Already following', { status: 409 });
    }

    await prisma.brandFollow.create({
      data: {
        userId: payload.uid,
        brandId,
      },
    });

    // Notify brand owner (24h dedup)
    const recentNotif = await prisma.notification.findFirst({
      where: {
        userId: brand.ownerId,
        type: 'new_brand_follower',
        link: `/partners/${brandId}`,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!recentNotif) {
      const follower = await prisma.cbcUser.findUnique({
        where: { id: payload.uid },
        select: { info: { select: { name: true } } },
      });
      const followerName = follower?.info?.name ?? 'Someone';

      await createNotification({
        userId: brand.ownerId,
        emoji: '🏢',
        textKey: `${followerName} started following ${brand.name}`,
        type: 'new_brand_follower',
        link: `/partners/${brandId}`,
      });
    }

    return new Response('Followed successfully', { status: 201 });
  } catch (err) {
    console.error('Brand follow error:', err);
    return new Response('Internal server error', { status: 500 });
  }
};

export const DELETE = async ({ params, cookies }: RequestEvent) => {
  try {
    const token = cookies.get('auth_token');
    if (!token) return new Response('Unauthorized', { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload?.uid) return new Response('Invalid token', { status: 401 });

    const brandId = params.id;
    if (!brandId) return new Response('Missing brand id', { status: 400 });

    await prisma.brandFollow.deleteMany({
      where: {
        userId: payload.uid,
        brandId,
      },
    });

    return new Response('Unfollowed successfully', { status: 200 });
  } catch (err) {
    console.error('Brand unfollow error:', err);
    return new Response('Internal server error', { status: 500 });
  }
};
