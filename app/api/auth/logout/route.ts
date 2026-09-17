import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  getCurrentUser,
  recordAuthActivity,
  revokeCurrentSession,
} from "@/lib/auth/session";

export const runtime = "edge";

export async function POST() {
  const user = await getCurrentUser();

  if (user) {
    await revokeCurrentSession();
    await recordAuthActivity(user.id, "logout", "User signed out.");
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}