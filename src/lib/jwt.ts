import { SignJWT, jwtVerify  } from 'jose';
import "dotenv/config";

const AUTH_SECRET = new TextEncoder().encode(process.env.AUTH_JWT_SECRET!);

export async function signJwt(payload: { uid: string; email: string; emailVerified?: boolean }): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(AUTH_SECRET);
}

export async function verifyJwt(token: string): Promise<{ uid: string; email: string; emailVerified?: boolean } | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET);
    return payload as { uid: string; email: string; emailVerified?: boolean };
  } catch (err: any) {
    if (err?.code === 'ERR_JWT_EXPIRED') {
      return null;
    }
    console.error('JWT verification failed:', err);
    return null;
  }
}