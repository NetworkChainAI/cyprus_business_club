import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params, parent }) => {
  const { userId } = await parent();

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      categories: { select: { id: true, name: true } },
      sponsors: {
        include: { brand: { select: { id: true, name: true, logoUrl: true } } },
        orderBy: { order: "asc" },
      },
      speakers: {
        include: { user: { include: { info: { select: { name: true, photo: true, status: true } } } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!event) throw redirect(302, "/admin/events");
  if (event.organizerId !== userId) throw redirect(302, "/admin/events");

  return { editEvent: event };
};
