import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";
import { error as kitError } from "@sveltejs/kit";
import { verifyJwt } from "$lib/jwt";

type Member = {
  id: string;
  email: string;
  info: { name: string | null; photo: string | null; status: string | null } | null;
  _count: { followers: number; following: number };
  isFollowing?: boolean;
  isMe?: boolean;
};

export const load: PageServerLoad = async ({ cookies }) => {
  try {
    const members = await prisma.cbcUser.findMany({
      where: { settings: { isPrivate: false } },
      select: {
        id: true,
        email: true,
        info: { select: { name: true, photo: true, status: true } },
        _count: { select: { followers: true, following: true } },
      },
      orderBy: { followers: { _count: "desc" } as any },
    });

    let recommendedMembers: typeof members = [];

    const token = cookies.get("auth_token");
    let myFollowingIds = new Set<string>();
    let myId: string | null = null;

    if (token) {
      const payload = await verifyJwt(token).catch(() => null);

      if (payload?.uid) {
        myId = payload.uid;

        const me = await prisma.cbcUser.findUnique({
          where: { id: payload.uid },
          select: { id: true, interests: { select: { id: true } } },
        });

        const myFollows = await prisma.cbcFollow.findMany({
          where: { followerId: payload.uid },
          select: { followingId: true },
        });
        myFollowingIds = new Set(myFollows.map((f) => f.followingId));

        const myInterestIds = (me?.interests ?? []).map((i) => i.id);

        if (myInterestIds.length > 0) {
          recommendedMembers = await prisma.cbcUser.findMany({
            where: {
              id: { not: payload.uid }, 
              settings: { isPrivate: false },
              interests: { some: { id: { in: myInterestIds } } },
            },
            select: {
              id: true,
              email: true,
              info: { select: { name: true, photo: true, status: true } },
              _count: { select: { followers: true, following: true } },
            },
            take: 8,
            orderBy: { followers: { _count: "desc" } as any },
          });
        }
      }
    }

    const membersWithFlags: Member[] = members.map((m) => ({
      ...m,
      isFollowing: myFollowingIds.has(m.id),
      isMe: myId === m.id,
    }));

    const recommendedWithFlags: Member[] = recommendedMembers.map((m) => ({
      ...m,
      isFollowing: myFollowingIds.has(m.id),
      isMe: myId === m.id, 
    }));

    return {
      members: membersWithFlags,
      recommendedMembers: recommendedWithFlags,
      followingIds: Array.from(myFollowingIds),
      myId,
    };
  } catch (e) {
    console.error("Error fetching members:", e);
    throw kitError(500, "Internal server error");
  }
};
