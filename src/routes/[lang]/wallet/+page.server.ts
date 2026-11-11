import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get("auth_token");

  if (!token) {
    return { user: null };
  }

  const payload = await verifyJwt(token);

  if (!payload || !payload.uid) {
    return { user: null };
  }

  const user = await prisma.cbcUser.findUnique({
    where: { id: payload.uid },
    select: {
      id: true,
      email: true,
      createdAt: true,
      info: {
        select: {
          name: true,
          photo: true,
          status: true,
          bio: true,
          location: true,
          dateOfBirth: true,
          custodyAddress: true
        }
      }
    }
  });

  return {
    user
  };
};
