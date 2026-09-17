import type { SessionUser } from "@/lib/auth/session";

export type UserRole = SessionUser["role"];

export function hasRole(user: SessionUser, allowedRoles: readonly UserRole[]) {
  return allowedRoles.includes(user.role);
}