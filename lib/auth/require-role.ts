import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole, type UserRole } from "@/lib/auth/permissions";

export async function requireRole(allowedRoles: readonly UserRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasRole(user, allowedRoles)) {
    redirect("/dashboard/unauthorized");
  }

  return user;
}