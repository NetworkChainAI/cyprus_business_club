import prisma from "$lib/prisma";
import type { LayoutServerLoad } from "./$types";
import { verifyJwt } from "$lib/jwt";
import { redirect } from "@sveltejs/kit";

function extractUserId(payload: any): string | null {
  if (!payload) return null;
  return payload.uid || payload.userId || payload.id || payload.sub || null;
}

export const load: LayoutServerLoad = async ({ cookies, params }) => {
  const lang = params.lang ?? "en";
  const token = cookies.get("auth_token");
  if (!token) throw redirect(302, `/${lang}/login`);

  let payload: any = null;
  try {
    payload = await verifyJwt(token);
  } catch {
    throw redirect(302, `/${lang}/login`);
  }

  const userId = extractUserId(payload);
  if (!userId) throw redirect(302, `/${lang}/login`);

  const user = await prisma.cbcUser.findUnique({
    where: { id: userId },
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
          phoneNumber: true,
          dateOfBirth: true,
          trustScore: true,
          role: true,
        },
      },
      settings: {
        select: {
          isPrivate: true,
          emailSend: true,
          chatBotSend: true,
        },
      },
      interests: { select: { id: true, name: true } },
      socialTotal: { select: { total: true, rank: true } },
    },
  });

  if (!user) throw redirect(302, `/${lang}/login`);

  const [followersCount, followingCount] = await Promise.all([
    prisma.cbcFollow.count({ where: { followingId: userId } }),
    prisma.cbcFollow.count({ where: { followerId: userId } }),
  ]);

  const registrations = await prisma.eventRegistration.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          photo: true,
          price: true,
          description: true,
          chatId: true,
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
    ownedBrands,
    ownedCommunities,
    allAchievements,
    userAchievements,
    allCategories,
    followersData,
    followingData,
  ] = await Promise.all([
    prisma.event.findMany({
      where: { organizerId: userId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        title: true,
        date: true,
        location: true,
        photo: true,
        price: true,
        chatId: true,
        categories: { select: { id: true, name: true } },
      },
    }),
    prisma.brand.findMany({
      where: { ownerId: userId, status: "ACTIVE" },
      select: { id: true, name: true, type: true, logoUrl: true },
    }),
    prisma.community.findMany({
      where: { owners: { some: { id: userId } } },
      select: { id: true, name: true, logoUrl: true },
    }),
    prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.eventCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.cbcFollow.findMany({
      where: { followingId: userId },
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
      where: { followerId: userId },
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

  return {
    user,
    followersCount,
    followingCount,
    followers: followersData.map((f) => f.follower),
    following: followingData.map((f) => f.following),
    registeredEvents,
    visitedEvents,
    upcomingEvents,
    createdEvents,
    ownedBrands,
    ownedCommunities,
    hasAdminAccess: ["PARTNER", "RESIDENT", "ADMIN"].includes(user.info?.role ?? "USER"),
    allAchievements,
    userAchievements,
    allCategories,
    socialCapital: user.socialTotal?.total ?? 0,
    socialRank: user.socialTotal?.rank ?? "Explorer",
    trustScore: user.info?.trustScore ?? 0,
  };
};
