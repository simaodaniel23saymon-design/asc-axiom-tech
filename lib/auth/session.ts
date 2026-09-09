import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const COOKIE_NAME = "asc_ops_session";

export type SessionUser = {
  email: string;
  name: string;
  role: "admin" | "team" | "investor";
};

const fallbackSecret = "asc-axiom-tech-local-dev-secret";

function toBase64Url(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return bytes;
}

function getCryptoKey(secret: string) {
  const encodedKey = new TextEncoder().encode(secret);
  return crypto.subtle.importKey("raw", encodedKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export function getSessionSecret() {
  return process.env.OPS_AUTH_SECRET ?? fallbackSecret;
}

export async function signSession(payload: SessionUser) {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = toBase64Url(JSON.stringify(payload));
  const signingInput = `${header}.${body}`;
  const key = await getCryptoKey(getSessionSecret());
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  const signature = toBase64Url(new Uint8Array(signatureBytes));

  return `${signingInput}.${signature}`;
}

export async function verifySession(token: string) {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;

    const signingInput = `${header}.${payload}`;
    const key = await getCryptoKey(getSessionSecret());
    const expected = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature),
      new TextEncoder().encode(signingInput),
    );

    if (!expected) return null;

    const decoded = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as SessionUser;
    if (!decoded.email || !decoded.name || !decoded.role) return null;

    return decoded;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const sessionCookie = cookies().get(COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  return verifySession(sessionCookie);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
