import type { PageServerLoad } from './$types';
import prisma from '$lib/prisma';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      emoji: n.emoji,
      textKey: n.textKey,
      type: n.type,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
  };
};
