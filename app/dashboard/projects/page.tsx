import { cookies, headers } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import ProjectsCrudClient, {
  type ProjectItem,
} from "@/components/ops/ProjectsCrudClient";

export const runtime = "edge";

type ProjectsResponse = {
  data: ProjectItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default async function ProjectsPage() {
  const user = await requireRole(["admin", "team"]);

  let projects: ProjectItem[] = [];
  let errorMessage = "";

  try {
    // Reencaminha a sessão actual para que a API repita a autenticação e o RBAC no servidor.
    const requestHeaders = await headers();
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
    const host =
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

    if (!host) {
      throw new Error("Request host unavailable.");
    }

    const response = await fetch(`${protocol}://${host}/api/ops/projects`, {
      headers: { cookie: cookies().toString() },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | ProjectsResponse
      | { error?: string }
      | null;

    if (!response.ok) {
      errorMessage =
        payload && "error" in payload && payload.error
          ? payload.error
          : "Não foi possível carregar os projectos.";
    } else if (payload && "data" in payload && Array.isArray(payload.data)) {
      projects = payload.data;
    } else {
      errorMessage = "A resposta dos projectos é inválida.";
    }
  } catch {
    errorMessage = "Não foi possível carregar os projectos.";
  }

  return (
    <div className="ops-page">
      <ProjectsCrudClient
        projects={projects}
        canDelete={user.role === "admin"}
        initialError={errorMessage || null}
      />
    </div>
  );
}
