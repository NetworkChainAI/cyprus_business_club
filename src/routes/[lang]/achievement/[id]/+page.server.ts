import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";

export const load: PageServerLoad = async ({ params, cookies }) => {
  const { id } = params;

  const token = cookies.get("auth_token");

  if (!token) {
    return {
      status: 401,
      error: "Not authenticated",
      achievement: null,
      userProgress: [],
      ownerCount: 0,
      totalUsers: 0,
      percentage: 0
    };
  }

  const payload = await verifyJwt(token);
  if (!payload?.uid) {
    return {
      status: 401,
      error: "Invalid token",
      achievement: null,
      userProgress: [],
      ownerCount: 0,
      totalUsers: 0,
      percentage: 0
    };
  }

  const userId = payload.uid;

  const achievement = await prisma.achievement.findUnique({
    where: { id }
  });

  if (!achievement) {
    return {
      status: 404,
      error: "Achievement not found",
      achievement: null,
      userProgress: [],
      ownerCount: 0,
      totalUsers: 0,
      percentage: 0
    };
  }

  const userProgress = await prisma.userAchievement.findMany({
    where: { userId, achievementId: id },
    orderBy: { level: "asc" }
  });

  const ownerCount = await prisma.userAchievement.count({
    where: { achievementId: id }
  });

  const totalUsers = await prisma.cbcUser.count();

  const percentage = totalUsers > 0
    ? Math.round((ownerCount / totalUsers) * 100)
    : 0;

  return {
    status: 200,
    achievement,
    userProgress,
    ownerCount,
    totalUsers,
    percentage
  };
};
