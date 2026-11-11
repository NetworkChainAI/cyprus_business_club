import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.user?.id) {
    return { user: null };
  }

  const dbUser = await prisma.cbcUser.findUnique({
    where: { id: locals.user.id },
    include: { info: true, settings: true, socialTotal: { select: { total: true, rank: true } } },
  });

  if (!dbUser) {
    return { user: null };
  }

  // Redirect to onboarding if not yet done — skip api/static/auth/onboarding paths
  const pathname = url.pathname;
  const isOnboardingRoute = pathname.includes('/onboarding');
  const isAuthRoute = pathname.includes('/login') || pathname.includes('/register');
  if (!dbUser.settings?.onboardingDone && !isOnboardingRoute && !isAuthRoute) {
    // Extract lang from pathname (e.g. /en/... or /ru/...)
    const langMatch = pathname.match(/^\/(en|ru)\//);
    const lang = langMatch ? langMatch[1] : 'en';
    throw redirect(302, `/${lang}/onboarding`);
  }

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      info: {
        name: dbUser.info?.name ?? null,
        photo: dbUser.info?.photo ?? null,
        status: dbUser.info?.status ?? 'Member',
        role: dbUser.info?.role ?? 'USER',
        trustScore: dbUser.info?.trustScore ?? 0,
      },
    },
    socialCapital: dbUser.socialTotal?.total ?? 0,
    socialRank: dbUser.socialTotal?.rank ?? 'Explorer',
  };
};
