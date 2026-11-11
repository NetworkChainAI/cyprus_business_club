import type { RequestHandler } from "./$types";
import { CustodyAPI } from "$lib/custody";
import { verifyJwt } from "$lib/jwt";
import prisma from "$lib/prisma";
import { recalcTrustScore, awardSocialCapital } from "$lib/reputation";
import { checkRateLimit, getClientIp } from "$lib/server/security";

export const POST: RequestHandler = async ({ request, cookies }) => {
  // Rate limit: 10 attempts per 15 minutes per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit("custody_login", ip, 10, 15 * 60_000);
  if (rl) return rl;

  const { password } = await request.json();

  const auth = cookies.get("auth_token");
  if (!auth) {
    return new Response(
      JSON.stringify({ ok: false, error: "Not authenticated" }),
      { status: 401 }
    );
  }

  const payload = await verifyJwt(auth);
  if (!payload?.uid) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid token" }),
      { status: 401 }
    );
  }

  const user = await prisma.cbcUser.findUnique({
    where: { id: payload.uid },
    include: { info: true }
  });

  if (!user?.email) {
    return new Response(
      JSON.stringify({ ok: false, error: "User not found" }),
      { status: 404 }
    );
  }

  const email = user.email;
  const api = new CustodyAPI();

  try {
    const token = await api.login(email, password);

    cookies.set("jwt", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60
    });

    if (!user.info?.custodyAddress) {
      api.setToken(token);
      const wallets = await api.getWallets();

      if (wallets.length > 0) {
        const mainWallet = wallets[0];

        await prisma.cbcUserInfo.update({
          where: { id: user.infoId! },
          data: {
            custodyAddress: mainWallet.address
          }
        });

        // First time wallet linked — trust + SC
        recalcTrustScore(payload.uid).catch(console.error);
        awardSocialCapital(payload.uid, "CUSTODY_OPENED", {
          refId: mainWallet.address,
          refType: "WALLET",
        }).catch(console.error);
      }
    }

    return new Response(JSON.stringify({ ok: true }));

  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error"
      }),
      { status: 400 }
    );
  }
};
