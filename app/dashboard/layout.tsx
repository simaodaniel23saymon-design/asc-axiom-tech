import { redirect } from "next/navigation";
import CommandCenterShell from "@/components/ops/CommandCenterShell";
import { getCurrentUser } from "@/lib/auth/session";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <CommandCenterShell user={user}>{children}</CommandCenterShell>;
}
