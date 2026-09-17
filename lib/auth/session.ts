import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { users, sessions, activities } from "@/db/schema";
import { getDb } from "@/lib/db";

export const COOKIE_NAME = "asc_ops_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "team" | "investor";
};

function toBase64Url(value: Uint8Array) {
  let binary = "";

  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toBase64Url(new Uint8Array(digest));
}

function createToken() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function createSession(user: SessionUser) {
  const token = createToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const db = getDb();

  await db.insert(sessions).values({ userId: user.id, tokenHash, expiresAt });

  return { token, expiresAt };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = await hashToken(token);
  const db = getDb();
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date()), eq(users.status, "active")))
    .limit(1);

  return rows[0] ?? null;
}

export async function revokeCurrentSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return;

  const db = getDb();
  await db.delete(sessions).where(eq(sessions.tokenHash, await hashToken(token)));
}

export async function recordAuthActivity(userId: string, type: "login" | "logout", text: string) {
  const db = getDb();
  await db.insert(activities).values({ userId, type, text });
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}
