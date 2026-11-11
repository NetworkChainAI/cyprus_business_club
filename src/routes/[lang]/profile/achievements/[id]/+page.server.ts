import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params, parent }) => {
  const { id } = params;
  const parentData = await parent();
  const userId = parentData.user?.id;

  const achievement = await prisma.achievement.findUnique({
    where: { id },
  });

  if (!achievement) throw error(404, "Achievement not found");

  const [userProgress, ownerCount, totalUsers] = await Promise.all([
    prisma.userAchievement.findMany({
      where: { userId, achievementId: id },
      orderBy: { level: "asc" },
    }),
    prisma.userAchievement.count({
      where: { achievementId: id },
    }),
    prisma.cbcUser.count(),
  ]);

  const percentage = totalUsers > 0 ? Math.round((ownerCount / totalUsers) * 100) : 0;

  return {
    achievement,
    userProgress,
    ownerCount,
    totalUsers,
    percentage,
  };
};
