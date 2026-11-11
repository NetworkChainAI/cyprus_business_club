import type { RequestEvent } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { signJwt } from "$lib/jwt";

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export const GET = async ({ url, cookies }: RequestEvent) => {
  const token = url.searchParams.get("token");
  const lang = url.searchParams.get("lang") === "ru" ? "ru" : "en";

  if (!token) {
    return new Response(null, { status: 302, headers: { Location: `/${lang}/login?error=invalid_token` } });
  }

  const user = await prisma.cbcUser.findUnique({
    where: { emailVerifyToken: token },
  });

  if (!user) {
    return new Response(null, { status: 302, headers: { Location: `/${lang}/login?error=invalid_token` } });
  }

  // Check token expiration (24 hours from account creation)
  const tokenAge = Date.now() - new Date(user.createdAt).getTime();
  if (tokenAge > TOKEN_MAX_AGE_MS) {
    return new Response(null, { status: 302, headers: { Location: `/${lang}/login?error=token_expired` } });
  }

  // Mark as verified
  await prisma.cbcUser.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null },
  });

  // Issue JWT and log in
  const jwt = await signJwt({ uid: user.id, email: user.email, emailVerified: true });

  cookies.set("auth_token", jwt, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return new Response(null, { status: 302, headers: { Location: `/${lang}/onboarding` } });
};
