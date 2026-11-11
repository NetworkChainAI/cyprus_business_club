import type { RequestEvent } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { sendVerificationEmail } from "$lib/server/email";
import { randomBytes } from "crypto";

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const POST = async ({ request, cookies }: RequestEvent) => {
  try {
    const { email } = await request.json();
    if (!email) return json({ error: "Missing email" }, 400);

    const user = await prisma.cbcUser.findUnique({ where: { email } });

    // Always return 200 to not leak whether email exists
    if (!user || user.emailVerified) return json({ ok: true });

    const token = randomBytes(32).toString("hex");
    await prisma.cbcUser.update({
      where: { id: user.id },
      data: { emailVerifyToken: token },
    });

    const lang = (cookies.get("lang") === "ru" ? "ru" : "en") as "en" | "ru";
    sendVerificationEmail(email, token, lang).catch(console.error);

    return json({ ok: true });
  } catch (err) {
    console.error("Resend verification error:", err);
    return json({ error: "Internal server error" }, 500);
  }
};
