import type { RequestHandler } from "./$types";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";
import { CustodyAPI } from "$lib/custody";
import { registerAfterPayment } from "$lib/server/registerAfterPayment";

const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS ?? "";

// In-memory cache for EUR→USD rate (5-minute TTL)
let cachedRate: { rate: number; fetchedAt: number } | null = null;
const RATE_TTL = 5 * 60 * 1000;

async function getEurToUsdRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < RATE_TTL) {
    return cachedRate.rate;
  }
  const res = await fetch("https://api.exchangerate-api.com/v4/latest/EUR");
  if (!res.ok) throw new Error("Failed to fetch exchange rate");
  const data = await res.json();
  const rate = data.rates?.USD;
  if (!rate || typeof rate !== "number") throw new Error("Invalid rate data");
  cachedRate = { rate, fetchedAt: Date.now() };
  return rate;
}

export const POST: RequestHandler = async ({ request, cookies, params }) => {
  // 1. Authenticate CBC user
  const authToken = cookies.get("auth_token");
  if (!authToken) {
    return new Response(
      JSON.stringify({ ok: false, error: "Not authenticated" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
  const payload = await verifyJwt(authToken);
  if (!payload?.uid) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid token" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // 2. Check custody session
  const custodyToken = cookies.get("jwt");
  if (!custodyToken) {
    return new Response(
      JSON.stringify({ ok: false, error: "Custody session expired. Please reconnect your wallet." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // 3. Check platform wallet configured
  if (!PLATFORM_WALLET) {
    console.error("PLATFORM_WALLET_ADDRESS env var not set");
    return new Response(
      JSON.stringify({ ok: false, error: "Crypto payment not available" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // 4. Parse request body
  let body: { otp: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid request" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { otp } = body;
  if (!otp || otp.length !== 6) {
    return new Response(
      JSON.stringify({ ok: false, error: "Enter the 6-digit confirmation code" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // 5. Look up event
  const eventId = params.id;
  if (!eventId) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing event ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return new Response(
      JSON.stringify({ ok: false, error: "Event not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  if (new Date(event.date) < new Date()) {
    return new Response(
      JSON.stringify({ ok: false, error: "This event has already ended" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const priceEur = event.price ?? 0;
  if (priceEur <= 0) {
    return new Response(
      JSON.stringify({ ok: false, error: "This is a free event" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // 6. Check if already registered
  const existing = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId: payload.uid, eventId } },
  });
  if (existing) {
    return new Response(
      JSON.stringify({ ok: false, error: "Already registered for this event" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // 7. Convert EUR → USDT (1 USDT ≈ 1 USD)
  let rate: number;
  try {
    rate = await getEurToUsdRate();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Could not fetch exchange rate. Try again." }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const amountUsdt = Math.round(priceEur * rate * 100) / 100;

  // 8. Execute withdrawal via custody service
  const api = new CustodyAPI();
  api.setToken(custodyToken);

  let txHash: string | null = null;
  try {
    txHash = await api.withdraw({
      amount: amountUsdt,
      currency: "USDT",
      chain: "Polygon",
      to: PLATFORM_WALLET,
      token: otp,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "Withdrawal failed",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!txHash) {
    return new Response(
      JSON.stringify({ ok: false, error: "Withdrawal returned no transaction hash" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // 9. Register user for event + create transaction
  try {
    await registerAfterPayment({
      userId: payload.uid,
      eventId,
      provider: "CRYPTO",
      providerPaymentId: txHash,
      amountPaid: amountUsdt,
      currency: "USDT",
      rawDetails: {
        eventId,
        priceEur,
        exchangeRate: rate,
        amountUsdt,
        txHash,
        chain: "Polygon",
        platformWallet: PLATFORM_WALLET,
        source: "crypto_pay",
      },
    });
  } catch (err) {
    console.error("Crypto payment succeeded but registration failed:", {
      txHash, eventId, userId: payload.uid, error: err,
    });
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Payment processed but registration failed. Contact support.",
        txHash,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, txHash, amountUsdt }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};
