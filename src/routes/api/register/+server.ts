import type { RequestEvent } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { hashPassword } from "$lib/crypto";
import { createUniqueReferralCode } from "$lib/utils/createUniqueReferralCode";
import { awardSocialCapital } from "$lib/reputation";
import { sendVerificationEmail } from "$lib/server/email";
import { randomBytes } from "crypto";
import { checkRateLimit, getClientIp, validatePassword } from "$lib/server/security";

export const POST = async ({ request, cookies }: RequestEvent) => {
  try {
    // Rate limit: 5 registrations per 15 minutes per IP
    const ip = getClientIp(request);
    const rl = checkRateLimit("register", ip, 5, 15 * 60_000);
    if (rl) return rl;

    const { email, password, name, referral } = await request.json();

    if (!email || !password) {
      return new Response("Email and password are required", { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response("Invalid email format", { status: 400 });
    }

    // Validate password strength
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return new Response(
        JSON.stringify({ error: "Weak password", details: pwCheck.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const existingUser = await prisma.cbcUser.findUnique({ where: { email } });
    if (existingUser) {
      return new Response("User already exists", { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const ownReferralCode = await createUniqueReferralCode();
    const emailVerifyToken = randomBytes(32).toString("hex");

    const user = await prisma.cbcUser.create({
      data: {
        email,
        password: hashedPassword,
        referralId: ownReferralCode,
        emailVerified: false,
        emailVerifyToken,

        invitedBy: referral
          ? { connect: { referralId: referral } }
          : undefined,

        settings: {
          create: {
            isPrivate: false,
            emailSend: false,
            chatBotSend: false,
          },
        },
        info: {
          create: {
            status: "Member",
            name,
          },
        },
      },
      include: { settings: true, info: true },
    });

    await prisma.cbcUser.update({
      where: { id: user.id },
      data: { infoId: user.info!.id },
    });

    const lang = (cookies.get("lang") === "ru" ? "ru" : "en") as "en" | "ru";

    // Send verification email (non-blocking)
    sendVerificationEmail(email, emailVerifyToken, lang).catch(console.error);

    // Reputation: +10 SC to referrer
    if (referral && user.invitedById) {
      awardSocialCapital(user.invitedById, "REFERRAL_REGISTERED", {
        refId: user.id,
        refType: "REFERRAL",
      }).catch(console.error);
    }

    cookies.delete("ref", { path: "/" });

    // No auth_token — user must verify email first
    return new Response(
      JSON.stringify({ pendingVerification: true, email }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};
