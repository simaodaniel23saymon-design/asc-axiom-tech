import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { createSession, recordAuthActivity, sessionCookieOptions } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

export const runtime = "edge";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];

  if (!user || user.status !== "active" || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const session = await createSession(user);

  try {
    await recordAuthActivity(user.id, "login", "User signed in.");
  } catch (error) {
    console.error("Failed to record login activity:", error);
  }

  const redirectTo =
    user.mustChangePassword || !user.profileCompleted
      ? "/account/setup"
      : "/dashboard";

  const response = NextResponse.json({ ok: true, redirectTo });
  response.cookies.set("asc_ops_session", session.token, sessionCookieOptions(session.expiresAt));

  return response;
}
