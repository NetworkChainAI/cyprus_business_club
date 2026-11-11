import type { LayoutServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";
import { redirect } from "@sveltejs/kit";

export const load: LayoutServerLoad = async ({ cookies, params }) => {
  const lang = params.lang ?? "en";
  const token = cookies.get("auth_token");
  if (!token) throw redirect(302, `/${lang}/login`);

  const payload = await verifyJwt(token);
  if (!payload?.uid) throw redirect(302, `/${lang}/login`);

  const user = await prisma.cbcUser.findUnique({
    where: { id: payload.uid },
    include: { info: true },
  });

  if (!user?.info || user.info.role !== "ADMIN") {
    throw redirect(302, `/${lang}/events`);
  }

  return {
    adminUser: {
      id: user.id,
      email: user.email,
      name: user.info.name,
    },
  };
};
