import type { RequestEvent } from "@sveltejs/kit";
import { getGoogleClient } from "$lib/google";
import prisma from "$lib/prisma";
import { SignJWT, type JWTPayload } from "jose";
import { awardSocialCapital } from "$lib/reputation";

const AUTH_JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_JWT_SECRET!
);

async function signJwt(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(AUTH_JWT_SECRET);
}

export const GET = async ({ url, cookies }: RequestEvent) => {
  try {
    const code = url.searchParams.get("code");
    if (!code) return new Response("Missing code", { status: 400 });

    const googleState = url.searchParams.get("state");

    const client = getGoogleClient();
    const { tokens } = await client.getToken(code);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return new Response("Invalid Google payload", { status: 400 });
    }

    const email = payload.email;
    const googleId = payload.sub;

    // Данные профиля из Google (могут быть null)
    const name = (payload.name ?? payload.given_name ?? null) as string | null;
    const photo = (payload.picture ?? null) as string | null;

    const user = await prisma.cbcUser.upsert({
      where: { email },

      update: {
        googleId,
        emailVerified: true,

        info: {
          upsert: {
            create: {
              name: name ?? undefined,
              photo: photo ?? undefined,
            },
            update: {
              ...(name ? { name } : {}),
              ...(photo ? { photo } : {}),
            },
          },
        },
      },

      create: {
        email,
        googleId,
        emailVerified: true,

        info: {
          create: {
            name: name ?? undefined,
            photo: photo ?? undefined,
          },
        },

        invitedBy: googleState
          ? { connect: { referralId: googleState } }
          : undefined,
      },
    });

    const token = await signJwt({
      uid: user.id,
      email: user.email,
      emailVerified: true,
    });

    cookies.set("auth_token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    cookies.delete("ref", { path: "/" });

    // Reputation: referral SC (only if new user with invitedById)
    if (googleState && user.invitedById) {
      awardSocialCapital(user.invitedById, "REFERRAL_REGISTERED", {
        refId: user.id,
        refType: "REFERRAL",
      }).catch(console.error);
    }

    const locale = cookies.get("lang") || "en";
    return new Response(null, {
      status: 302,
      headers: { Location: `/${locale}/` },
    });
  } catch (err) {
    console.error("Google OAuth error:", err);
    return new Response("OAuth failed", { status: 500 });
  }
};
