import { redirect } from "next/navigation";
import CommandCenterShell from "@/components/ops/CommandCenterShell";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "edge";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <CommandCenterShell user={user}>{children}</CommandCenterShell>;
}
