import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params, parent }) => {
  const { userId } = await parent();

  const community = await prisma.community.findUnique({
    where: { id: params.id },
    include: {
      owners: { select: { id: true } },
    },
  });

  if (!community) throw redirect(302, "/admin/communities");

  const isOwner = community.owners.some((o) => o.id === userId);
  if (!isOwner) throw redirect(302, "/admin/communities");

  return {
    editCommunity: {
      id: community.id,
      name: community.name,
      logoUrl: community.logoUrl,
      isPrivate: community.isPrivate,
    },
  };
};
