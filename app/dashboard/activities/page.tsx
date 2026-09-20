import { redirect } from "next/navigation";

import ActivitiesHistory from "@/components/ops/ActivitiesHistory";
import { hasRole } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "edge";

export default async function ActivitiesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasRole(user, ["admin", "team"])) {
    redirect("/dashboard");
  }

  return (
    <div className="ops-page">
      <ActivitiesHistory />
    </div>
  );
}
