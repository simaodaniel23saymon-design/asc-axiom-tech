import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac } from "crypto";

export const COOKIE_NAME = "asc_ops_session";

export type SessionUser = {
  email: string;
  name: string;
  role: "admin" | "team" | "investor";
};

const fallbackSecret = "asc-axiom-tech-local-dev-secret";

export function getSessionSecret() {
  return process.env.OPS_AUTH_SECRET ?? fallbackSecret;
}

export function signSession(payload: SessionUser) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret())
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

export function verifySession(token: string) {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;

    const expected = createHmac("sha256", getSessionSecret())
      .update(`${header}.${payload}`)
      .digest("base64url");

    if (expected !== signature) return null;

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as SessionUser;
    if (!decoded.email || !decoded.name || !decoded.role) return null;

    return decoded;
  } catch {
    return null;
  }
}

export function getCurrentUser() {
  const sessionCookie = cookies().get(COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  return verifySession(sessionCookie);
}

export function requireUser() {
  const user = getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
