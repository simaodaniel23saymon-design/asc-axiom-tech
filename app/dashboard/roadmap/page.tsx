import { cookies, headers } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import RoadmapCrudClient, {
  type RoadmapItem,
} from "@/components/ops/RoadmapCrudClient";

type RoadmapResponse = {
  data: RoadmapItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const runtime = "edge";

export default async function RoadmapPage() {
  const user = await requireRole(["admin", "team"]);

  let roadmap: RoadmapItem[] = [];
  let errorMessage: string | null = null;

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
      `${protocol}://${host}/api/ops/roadmap`,
      {
        headers: {
          cookie: cookies().toString(),
        },
        cache: "no-store",
      },
    );

    const payload = (await response
      .json()
      .catch(() => null)) as
      | RoadmapResponse
      | { error?: string }
      | null;

    if (!response.ok) {
      errorMessage =
        payload &&
        "error" in payload &&
        payload.error
          ? payload.error
          : "Não foi possível carregar o roadmap.";
    } else if (
      payload &&
      "data" in payload &&
      Array.isArray(payload.data)
    ) {
      roadmap = payload.data;
    } else {
      errorMessage =
        "A resposta do roadmap é inválida.";
    }
  } catch {
    errorMessage =
      "Não foi possível carregar o roadmap.";
  }

  return (
    <div className="ops-page">
      <RoadmapCrudClient
        roadmap={roadmap}
        canDelete={user.role === "admin"}
        initialError={errorMessage}
      />
    </div>
  );
}
