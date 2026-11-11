import prisma from "$lib/prisma";
import type { LayoutServerLoad } from "./$types";
import { verifyJwt } from "$lib/jwt";

export const load: LayoutServerLoad = async ({ params, cookies }) => {
  const { id } = params;

  const token = cookies.get("auth_token");
  let currentUserId: string | null = null;

  if (token) {
    const payload = await verifyJwt(token).catch(() => null);
    if (payload?.uid) currentUserId = payload.uid;
  }

  const member = await prisma.cbcUser.findUnique({
    where: { id },
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
          bio: true,
          location: true,
          dateOfBirth: true,
          trustScore: true,
        },
      },
      interests: { select: { id: true, name: true } },
      socialTotal: { select: { total: true, rank: true } },
    },
  });

  if (!member) {
    return { member: null, currentUserId };
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: id },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          photo: true,
          price: true,
          categories: { select: { id: true, name: true } },
        },
      },
    },
  });

  const now = new Date();
  const registeredEvents = registrations.map((r) => r.event);
  const visitedEvents = registeredEvents.filter((e) => e.date < now);
  const upcomingEvents = registeredEvents.filter((e) => e.date >= now);

  const [
    createdEvents,
    followersCount,
    followingCount,
    followersData,
    followingData,
  ] = await Promise.all([
    prisma.event.findMany({
      where: { organizerId: id },
      orderBy: { date: "desc" },
      select: {
        id: true,
        title: true,
        date: true,
        location: true,
        photo: true,
        price: true,
        categories: { select: { id: true, name: true } },
      },
    }),
    prisma.cbcFollow.count({ where: { followingId: id } }),
    prisma.cbcFollow.count({ where: { followerId: id } }),
    prisma.cbcFollow.findMany({
      where: { followingId: id },
      include: {
        follower: {
          select: {
            id: true,
            email: true,
            info: { select: { name: true, photo: true, status: true } },
          },
        },
      },
    }),
    prisma.cbcFollow.findMany({
      where: { followerId: id },
      include: {
        following: {
          select: {
            id: true,
            email: true,
            info: { select: { name: true, photo: true, status: true } },
          },
        },
      },
    }),
  ]);

  let isFollowing = false;
  if (currentUserId && currentUserId !== id) {
    const follow = await prisma.cbcFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: id,
        },
      },
      select: { id: true },
    });
    isFollowing = !!follow;
  }

  return {
    member: { ...member, isFollowing },
    currentUserId,
    followersCount,
    followingCount,
    followers: followersData.map((f) => f.follower),
    following: followingData.map((f) => f.following),
    upcomingEvents,
    visitedEvents,
    createdEvents,
  };
};
