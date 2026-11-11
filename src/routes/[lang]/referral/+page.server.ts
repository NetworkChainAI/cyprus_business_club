import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get("auth_token");

  if (!token) {
    return {
      status: 401,
      error: "Not authenticated",
      referralId: null,
      referrals: []
    };
  }

  const payload = await verifyJwt(token);
  if (!payload?.uid) {
    return {
      status: 401,
      error: "Invalid token",
      referralId: null,
      referrals: []
    };
  }

  const user = await prisma.cbcUser.findUnique({
    where: { id: payload.uid },
    select: {
      referralId: true,
      invitedUsers: {
        select: {
          id: true,
          email: true,
          createdAt: true,
          info: {
            select: {
              name: true,
              photo: true
            }
          }
        }
      }
    }
  });

  const enriched = user?.invitedUsers ?? [];

  return {
    referralId: user?.referralId ?? null,
    referrals: enriched
  };
};
