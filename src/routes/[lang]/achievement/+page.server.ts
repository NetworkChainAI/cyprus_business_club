import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get("auth_token");

  if (!token) {
    return {
      status: 401,
      error: "Not authenticated",
      achievements: [],
      userAchievements: []
    };
  }

  const payload = await verifyJwt(token);

  if (!payload?.uid) {
    return {
      status: 401,
      error: "Invalid token",
      achievements: [],
      userAchievements: []
    };
  }

  const userId = payload.uid;

  const achievements = await prisma.achievement.findMany({
    orderBy: { createdAt: "asc" }
  });

  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true
    },
    orderBy: { earnedAt: "desc" }
  });

  return {
    status: 200,
    achievements,
    userAchievements
  };
};
