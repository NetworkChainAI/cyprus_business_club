import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';
import { createNotification } from '$lib/services/notifications';
import { awardSocialCapital } from '$lib/reputation';

// Approve a join request
export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = cookies.get('auth_token');
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyJwt(token);
  const userId = payload?.uid;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const { requestId } = await request.json();
  if (!requestId) return json({ error: 'requestId required' }, { status: 400 });

  const joinReq = await prisma.communityJoinRequest.findUnique({
    where: { id: requestId },
    include: {
      community: { include: { owners: { select: { id: true } } } },
    },
  });

  if (!joinReq) return json({ error: 'Request not found' }, { status: 404 });

  // Verify caller is owner
  const isOwner = joinReq.community.owners.some((o) => o.id === userId);
  if (!isOwner) return json({ error: 'Forbidden' }, { status: 403 });

  // Add user to members and delete request
  await prisma.$transaction([
    prisma.community.update({
      where: { id: joinReq.communityId },
      data: { members: { connect: { id: joinReq.userId } } },
    }),
    prisma.communityJoinRequest.delete({ where: { id: requestId } }),
  ]);

  // Notify the user that they were accepted
  await createNotification({
    userId: joinReq.userId,
    emoji: '🎉',
    textKey: `You were accepted into "${joinReq.community.name}"`,
    type: 'community_accepted',
    link: `/communities/${joinReq.community.name}`,
  });

  // Reputation: +5 SC to the new member
  awardSocialCapital(joinReq.userId, "COMMUNITY_JOINED", {
    refId: joinReq.communityId,
    refType: "COMMUNITY",
  }).catch(console.error);

  return json({ ok: true });
};

// Reject a join request
export const DELETE: RequestHandler = async ({ request, cookies }) => {
  const token = cookies.get('auth_token');
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyJwt(token);
  const userId = payload?.uid;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const { requestId } = await request.json();
  if (!requestId) return json({ error: 'requestId required' }, { status: 400 });

  const joinReq = await prisma.communityJoinRequest.findUnique({
    where: { id: requestId },
    include: {
      community: { include: { owners: { select: { id: true } } } },
    },
  });

  if (!joinReq) return json({ error: 'Request not found' }, { status: 404 });

  const isOwner = joinReq.community.owners.some((o) => o.id === userId);
  if (!isOwner) return json({ error: 'Forbidden' }, { status: 403 });

  await prisma.communityJoinRequest.delete({ where: { id: requestId } });

  // Notify the user that they were rejected
  await createNotification({
    userId: joinReq.userId,
    emoji: '😔',
    textKey: `Your request to join "${joinReq.community.name}" was declined`,
    type: 'community_rejected',
    link: `/communities/${joinReq.community.name}`,
  });

  return json({ ok: true });
};
