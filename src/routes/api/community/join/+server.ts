import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';
import { createNotification } from '$lib/services/notifications';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = cookies.get('auth_token');
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyJwt(token);
  const userId = payload?.uid;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { communityId, message } = body;

  if (!communityId) return json({ error: 'communityId required' }, { status: 400 });

  // Check community exists
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      members: { where: { id: userId }, select: { id: true } },
      owners: { where: { id: userId }, select: { id: true } },
    },
  });

  if (!community) return json({ error: 'Community not found' }, { status: 404 });

  // Already a member or owner
  if (community.members.length > 0 || community.owners.length > 0) {
    return json({ error: 'Already a member' }, { status: 400 });
  }

  // Check for existing request
  const existing = await prisma.communityJoinRequest.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });

  if (existing) return json({ error: 'Request already sent' }, { status: 400 });

  // Create join request
  await prisma.communityJoinRequest.create({
    data: {
      communityId,
      userId,
      message: message || null,
    },
  });

  // Get user info for notification
  const userRecord = await prisma.cbcUser.findUnique({
    where: { id: userId },
    select: { info: { select: { name: true } } },
  });
  const userName = userRecord?.info?.name ?? 'Someone';

  // Notify the requesting user that their request was sent
  await createNotification({
    userId,
    emoji: '📨',
    textKey: `Your join request for "${community.name}" has been sent`,
    type: 'community_request_sent',
    link: `/communities/${community.name}`,
  });

  // Notify all community owners about the new join request
  const owners = await prisma.community.findUnique({
    where: { id: communityId },
    select: { owners: { select: { id: true } } },
  });

  if (owners?.owners) {
    for (const owner of owners.owners) {
      await createNotification({
        userId: owner.id,
        emoji: '📥',
        textKey: `${userName} wants to join "${community.name}"`,
        type: 'community_join_request',
        link: `/communities/${community.name}`,
      });
    }
  }

  return json({ ok: true });
};
