import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, signSession } from "@/lib/auth/session";

export const runtime = "edge";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const validEmail = "admin@ascaxiomtech.com";
  const validPassword = process.env.DEV_OPS_PASSWORD ?? "NZoCHAIN2025!";

  if (!email || !password || email !== validEmail || password !== validPassword) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = await signSession({
    email,
    name: "Afonso Costa",
    role: "admin",
  });

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
}
