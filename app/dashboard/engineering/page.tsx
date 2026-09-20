import { cookies, headers } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import EngineeringCrudClient from "@/components/ops/EngineeringCrudClient";

export const runtime = "edge";

type ProjectStatus =
  | "planning"
  | "in_progress"
  | "review"
  | "live"
  | "completed"
  | "blocked";

type MilestoneStatus =
  | "planned"
  | "in_progress"
  | "review"
  | "completed"
  | "blocked";

type Priority = "high" | "medium" | "low";

type EngineeringUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "team" | "investor";
  status: string;
};

type EngineeringRoadmap = {
  id: string;
  phase: string;
  title: string;
  description: string | null;
  status: string;
  priority: Priority;
  startDate: string | null;
  deadline: string | null;
};

type EngineeringProject = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  responsible: string | null;
  ownerId: string | null;
  startDate: string | null;
  deadline: string | null;
};

type EngineeringMilestone = {
  id: string;
  projectId: string | null;
  roadmapId: string | null;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  progress: number;
  dueDate: string | null;
};

type EngineeringTask = {
  id: string;
  projectId: string | null;
  milestoneId: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  ownerLabel: string | null;
  ownerId: string | null;
  completed: boolean;
  dueDate: string | null;
};

type EngineeringResponse = {
  data: {
    projects: EngineeringProject[];
    milestones: EngineeringMilestone[];
    tasks: EngineeringTask[];
    users: EngineeringUser[];
    roadmaps: EngineeringRoadmap[];
  };
};

export default async function EngineeringPage() {
  const user = await requireRole(["admin", "team"]);

  let engineering: EngineeringResponse["data"] = {
    projects: [],
    milestones: [],
    tasks: [],
    users: [],
    roadmaps: [],
  };

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
      `${protocol}://${host}/api/ops/engineering`,
      {
        headers: {
          cookie: cookies().toString(),
        },
        cache: "no-store",
      },
    );

    const payload = (await response.json().catch(() => null)) as
      | EngineeringResponse
      | { error?: string }
      | null;

    if (!response.ok) {
      errorMessage =
        payload && "error" in payload && payload.error
          ? payload.error
          : "Não foi possível carregar os dados de Engineering.";
    } else if (
      payload &&
      "data" in payload &&
      payload.data &&
      Array.isArray(payload.data.projects) &&
      Array.isArray(payload.data.milestones) &&
      Array.isArray(payload.data.tasks) &&
      Array.isArray(payload.data.users) &&
      Array.isArray(payload.data.roadmaps)
    ) {
      engineering = payload.data;
    } else {
      errorMessage = "A resposta de Engineering é inválida.";
    }
  } catch {
    errorMessage = "Não foi possível carregar os dados de Engineering.";
  }

  return (
    <EngineeringCrudClient
      projects={engineering.projects}
      milestones={engineering.milestones}
      tasks={engineering.tasks}
      users={engineering.users}
      roadmaps={engineering.roadmaps}
      canDelete={user.role === "admin"}
      initialError={errorMessage}
    />
  );
}
