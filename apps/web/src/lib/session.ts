import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

const COOKIE = "session";
const MAX_AGE_S = 60 * 60 * 24 * 14;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || (s === "change-me" && process.env.NODE_ENV === "production")) {
    throw new Error("Set AUTH_SECRET to a long random string");
  }
  return s;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

// Cookie value is `<userId>.<expiryMs>.<hmac>`; cuid ids contain no dots.
export async function createSession(userId: string) {
  const payload = `${userId}.${Date.now() + MAX_AGE_S * 1000}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function readSessionUserId(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  const parts = value?.split(".");
  if (!parts || parts.length !== 3) return null;
  const [userId, expiry, mac] = parts;
  const expected = Buffer.from(sign(`${userId}.${expiry}`));
  const actual = Buffer.from(mac);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  await connection(); // the expiry check reads the clock, so it must run at request time
  return Number(expiry) > Date.now() ? userId : null;
}
