import { cookies, headers } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import GoalsCrudClient, {
  type GoalItem,
} from "@/components/ops/GoalsCrudClient";

export const runtime = "edge";

type GoalsResponse = {
  data: GoalItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default async function GoalsPage() {
  const user = await requireRole(["admin", "team"]);

  let goals: GoalItem[] = [];
  let errorMessage = "";

  try {
    const requestHeaders = headers();
    const protocol =
      requestHeaders.get("x-forwarded-proto") ?? "http";
    const host =
      requestHeaders.get("x-forwarded-host") ??
      requestHeaders.get("host");

    if (!host) {
      throw new Error("Request host unavailable.");
    }

    const response = await fetch(
      `${protocol}://${host}/api/ops/goals`,
      {
        headers: {
          cookie: cookies().toString(),
        },
        cache: "no-store",
      },
    );

    const payload = (await response.json().catch(() => null)) as
      | GoalsResponse
      | { error?: string }
      | null;

    if (!response.ok) {
      errorMessage =
        payload &&
        "error" in payload &&
        payload.error
          ? payload.error
          : "Não foi possível carregar os objectivos.";
    } else if (
      payload &&
      "data" in payload &&
      Array.isArray(payload.data)
    ) {
      goals = payload.data;
    } else {
      errorMessage =
        "A resposta dos objectivos é inválida.";
    }
  } catch {
    errorMessage =
      "Não foi possível carregar os objectivos.";
  }

  return (
    <div className="ops-page">
      <GoalsCrudClient
        goals={goals}
        canDelete={user.role === "admin"}
        initialError={errorMessage || null}
      />
    </div>
  );
}
