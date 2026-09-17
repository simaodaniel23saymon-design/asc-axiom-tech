import { NextResponse } from "next/server";
import type { SessionUser } from "@/lib/auth/session";
import { hasRole, type UserRole } from "@/lib/auth/permissions";

export function authorizeApi(
  user: SessionUser | null,
  allowedRoles: readonly UserRole[],
): NextResponse | null {
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!hasRole(user, allowedRoles)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}