import { cookies, headers } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import TeamCrudClient from "@/components/ops/TeamCrudClient";

export const runtime = "edge";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  focus: string | null;
  active: boolean;
};

type TeamResponse = {
  data: TeamMember[];
};

export default async function TeamPage() {
  const user = await requireRole(["admin", "team"]);

  let teamMembers: TeamMember[] = [];
  let errorMessage = "";

  try {
    const requestHeaders = headers();
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
    const host =
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

    if (!host) {
      throw new Error("Request host unavailable.");
    }

    const response = await fetch(`${protocol}://${host}/api/ops/team`, {
      headers: { cookie: cookies().toString() },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | TeamResponse
      | { error?: string }
      | null;

    if (!response.ok) {
      errorMessage =
        payload && "error" in payload && payload.error
          ? payload.error
          : "Não foi possível carregar a equipa.";
    } else if (
      payload &&
      "data" in payload &&
      Array.isArray(payload.data)
    ) {
      teamMembers = payload.data;
    } else {
      errorMessage = "A resposta da equipa é inválida.";
    }
  } catch {
    errorMessage = "Não foi possível carregar a equipa.";
  }

  return (
    <div className="ops-page">
      <TeamCrudClient
        teamMembers={teamMembers}
        canDelete={user.role === "admin"}
        initialError={errorMessage}
      />
    </div>
  );
}
