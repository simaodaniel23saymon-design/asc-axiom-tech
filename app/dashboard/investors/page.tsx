import { cookies, headers } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import InvestorsCrudClient from "@/components/ops/InvestorsCrudClient";

export const runtime = "edge";

type Investor = {
  id: string;
  name: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  status:
    | "prospect"
    | "contacted"
    | "meeting"
    | "due_diligence"
    | "committed"
    | "closed"
    | "inactive";
  notes: string | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
};

type InvestorsResponse = {
  data: Investor[];
};

export default async function InvestorsPage() {
  const user = await requireRole(["admin", "investor"]);

  let investors: Investor[] = [];
  let errorMessage = "";

  try {
    const requestHeaders = await headers();
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
    const host =
      requestHeaders.get("x-forwarded-host") ??
      requestHeaders.get("host");

    if (!host) {
      throw new Error("Request host unavailable.");
    }

    const response = await fetch(
      `${protocol}://${host}/api/ops/investors`,
      {
        headers: {
          cookie: cookies().toString(),
        },
        cache: "no-store",
      },
    );

    const payload = (await response.json().catch(() => null)) as
      | InvestorsResponse
      | { error?: string }
      | null;

    if (!response.ok) {
      errorMessage =
        payload && "error" in payload && payload.error
          ? payload.error
          : "Não foi possível carregar os investidores.";
    } else if (
      payload &&
      "data" in payload &&
      Array.isArray(payload.data)
    ) {
      investors = payload.data;
    } else {
      errorMessage = "A resposta dos investidores é inválida.";
    }
  } catch {
    errorMessage = "Não foi possível carregar os investidores.";
  }

  return (
    <InvestorsCrudClient
      investors={investors}
      canDelete={user.role === "admin"}
      initialError={errorMessage}
    />
  );
}
