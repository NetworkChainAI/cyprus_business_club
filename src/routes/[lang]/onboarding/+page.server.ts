import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('auth_token');
  const payload = token ? await verifyJwt(token) : null;

  // Not logged in → redirect to login
  if (!payload?.uid) throw redirect(302, '/login');

  // Already completed onboarding → redirect to home
  const settings = await prisma.cbcUserSetting.findUnique({
    where: { userId: payload.uid },
    select: { onboardingDone: true },
  });
  if (settings?.onboardingDone) throw redirect(302, '/');

  const categories = await prisma.eventCategory.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return { categories };
};
