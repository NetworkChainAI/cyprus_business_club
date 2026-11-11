import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';
import { awardSocialCapital, recalcTrustScore } from '$lib/reputation';
import fs from 'fs';
import path from 'path';

const uploadDir = path.resolve('static/uploads/avatars');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = cookies.get('auth_token');
  const payload = token ? await verifyJwt(token) : null;
  if (!payload?.uid) return json({ error: 'Unauthorized' }, { status: 401 });

  const fd = await request.formData();

  const categoryIdsRaw = fd.get('categoryIds');
  const categoryIds: string[] = categoryIdsRaw ? JSON.parse(String(categoryIdsRaw)) : [];

  const bio = String(fd.get('bio') || '').trim() || null;
  const location = String(fd.get('location') || '').trim() || null;

  let photoUrl: string | null = null;
  const file = fd.get('photo') as File | null;
  if (file && file.size > 0) {
    if (!file.type.startsWith('image/')) return json({ error: 'Photo must be an image' }, { status: 400 });
    const ext = path.extname(file.name) || `.${file.type.split('/')[1] || 'jpg'}`;
    const fileName = `${payload.uid}_${Date.now()}${ext}`;
    fs.writeFileSync(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));
    photoUrl = `/uploads/avatars/${fileName}`;
  }

  // Find the user's info record id first (CbcUserInfo has its own id)
  const user = await prisma.cbcUser.findUnique({
    where: { id: payload.uid },
    select: { info: { select: { id: true } } },
  });

  await prisma.$transaction([
    // Save interests
    prisma.cbcUser.update({
      where: { id: payload.uid },
      data: {
        interests: categoryIds.length > 0
          ? { set: categoryIds.map((id) => ({ id })) }
          : undefined,
      },
    }),
    // Save profile info (CbcUserInfo keyed by its own id)
    ...(user?.info ? [prisma.cbcUserInfo.update({
      where: { id: user.info.id },
      data: {
        ...(bio !== null && { bio }),
        ...(location !== null && { location }),
        ...(photoUrl !== null && { photo: photoUrl }),
      },
    })] : []),
    // Mark onboarding done (CbcUserSetting keyed by userId)
    // Use upsert: Google OAuth users may not have a settings record yet
    prisma.cbcUserSetting.upsert({
      where: { userId: payload.uid },
      update: { onboardingDone: true },
      create: {
        userId: payload.uid,
        isPrivate: false,
        emailSend: false,
        chatBotSend: false,
        onboardingDone: true,
      },
    }),
  ]);

  // Award reputation for completing profile
  // - Trust score: recalc (photo adds +5 if uploaded)
  // - Social capital: +15 one-time for completing onboarding
  await Promise.all([
    recalcTrustScore(payload.uid),
    awardSocialCapital(payload.uid, 'PROFILE_COMPLETED', { refId: payload.uid }),
  ]);

  return json({ ok: true });
};
