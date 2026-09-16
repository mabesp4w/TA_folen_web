import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "kanaan_session";
export const SESSION_TTL = 60 * 60 * 24 * 7;

export type Session = {
  id: string;
  username: string;
  role: string;
  badan_pengurus?: string | null;
  exp: number;
};

export type SafeUser = {
  id: string;
  username: string;
  role: string;
  badan_pengurus?: string | null;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

// --- Password hashing (scrypt) ---
// Password disimpan sebagai "scrypt$<salt-hex>$<hash-hex>", bukan teks biasa,
// sehingga isi kolom `password` di database tidak dapat dibaca kembali.
// scrypt sudah tersedia di node:crypto, jadi tidak perlu dependensi tambahan.

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const [, salt, hashHex] = parts;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length === 0) return false;

  // Turunkan dengan panjang yang sama, lalu bandingkan secara constant-time.
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(user: SafeUser): string {
  const exp = Date.now() + SESSION_TTL * 1000;
  // Bangun payload secara eksplisit — JANGAN menyebar (...user) objek Prisma,
  // agar kolom sensitif (mis. hash password) tidak ikut masuk ke cookie.
  const session: Session = {
    id: user.id,
    username: user.username,
    role: user.role,
    badan_pengurus: user.badan_pengurus,
    exp,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): Session | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const actual = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);

  if (actual.length !== expectedBuf.length || !timingSafeEqual(actual, expectedBuf)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (typeof session.exp !== "number" || session.exp < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getSession(request: NextRequest): Session | null {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export function setSessionCookie(response: NextResponse, user: SafeUser): NextResponse {
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
