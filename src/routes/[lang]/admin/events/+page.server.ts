import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";

export const load: PageServerLoad = async ({ parent }) => {
  const { userId } = await parent();

  const events = await prisma.event.findMany({
    where: { organizerId: userId },
    include: {
      categories: { select: { id: true, name: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { date: "desc" },
  });

  return {
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      location: e.location,
      photo: e.photo,
      price: e.price,
      isActive: e.isActive,
      categories: e.categories,
      registrationsCount: e._count.registrations,
    })),
  };
};
