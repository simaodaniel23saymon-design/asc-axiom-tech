import { cookies, headers } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";

export const runtime = "edge";

type EngineeringProject = {
  id: string;
  name: string;
  status: "planning" | "in_progress" | "review" | "live" | "completed" | "blocked";
  priority: "high" | "medium" | "low";
  progress: number;
  responsible: string | null;
  deadline: string | null;
};

type EngineeringMilestone = {
  id: string;
  projectId: string | null;
  title: string;
  status: "planned" | "in_progress" | "review" | "completed" | "blocked";
  progress: number;
  dueDate: string | null;
};

type EngineeringTask = {
  id: string;
  projectId: string | null;
  milestoneId: string | null;
  title: string;
  priority: "high" | "medium" | "low";
  ownerLabel: string | null;
  completed: boolean;
  dueDate: string | null;
};

type EngineeringResponse = {
  data: {
    projects: EngineeringProject[];
    milestones: EngineeringMilestone[];
    tasks: EngineeringTask[];
  };
};

const projectStatusLabels: Record<EngineeringProject["status"], string> = {
  planning: "Planning",
  in_progress: "In progress",
  review: "Review",
  live: "Live",
  completed: "Completed",
  blocked: "Blocked",
};

const milestoneStatusLabels: Record<EngineeringMilestone["status"], string> = {
  planned: "Planned",
  in_progress: "In progress",
  review: "Review",
  completed: "Completed",
  blocked: "Blocked",
};

const priorityLabels: Record<EngineeringProject["priority"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function formatDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function EngineeringPage() {
  await requireRole(["admin", "team"]);

  let engineering: EngineeringResponse["data"] = {
    projects: [],
    milestones: [],
    tasks: [],
  };
  let errorMessage = "";

  try {
    // Reencaminha a sessão actual para que a API repita a autenticação e o RBAC no servidor.
    const requestHeaders = headers();
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

    if (!host) {
      throw new Error("Request host unavailable.");
    }

    const response = await fetch(`${protocol}://${host}/api/ops/engineering`, {
      headers: { cookie: cookies().toString() },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as EngineeringResponse | { error?: string } | null;

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
      Array.isArray(payload.data.tasks)
    ) {
      engineering = payload.data;
    } else {
      errorMessage = "A resposta de Engineering é inválida.";
    }
  } catch {
    errorMessage = "Não foi possível carregar os dados de Engineering.";
  }

  return (
    <div className="ops-page">
      <section className="ops-card">
        <div className="card-header-row">
          <h2>Engineering</h2>
          <span className="status-pill neutral">Status</span>
        </div>
      </section>

      {errorMessage ? <p className="empty-state">{errorMessage}</p> : null}

      {!errorMessage ? (
        <div className="content-grid two-col">
          <section className="ops-card">
            <div className="card-header-row">
              <h2>Projects</h2>
              <span className="status-pill neutral">{engineering.projects.length}</span>
            </div>
            {engineering.projects.length === 0 ? (
              <p className="empty-state">Ainda não existem projectos.</p>
            ) : (
              <div className="stack-list">
                {engineering.projects.map((project) => (
                  <div key={project.id} className="stack-item">
                    <div>
                      <strong>{project.name}</strong>
                      {project.responsible ? <small>{project.responsible}</small> : null}
                      <small>Progress: {project.progress}%</small>
                    </div>
                    <div className="stack-meta">
                      <span className="status-pill neutral">{projectStatusLabels[project.status]}</span>
                      <span className={`priority-badge ${project.priority}`}>
                        {priorityLabels[project.priority]}
                      </span>
                      {formatDate(project.deadline) ? (
                        <small>
                          Deadline: <time dateTime={project.deadline ?? undefined}>{formatDate(project.deadline)}</time>
                        </small>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ops-card">
            <div className="card-header-row">
              <h2>Milestones</h2>
              <span className="status-pill neutral">{engineering.milestones.length}</span>
            </div>
            {engineering.milestones.length === 0 ? (
              <p className="empty-state">Ainda não existem milestones.</p>
            ) : (
              <div className="stack-list">
                {engineering.milestones.map((milestone) => (
                  <div key={milestone.id} className="stack-item">
                    <div>
                      <strong>{milestone.title}</strong>
                      {milestone.projectId ? <small>Project: {milestone.projectId}</small> : null}
                      <small>Progress: {milestone.progress}%</small>
                    </div>
                    <div className="stack-meta">
                      <span className="status-pill neutral">{milestoneStatusLabels[milestone.status]}</span>
                      {formatDate(milestone.dueDate) ? (
                        <small>
                          Due: <time dateTime={milestone.dueDate ?? undefined}>{formatDate(milestone.dueDate)}</time>
                        </small>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ops-card">
            <div className="card-header-row">
              <h2>Tasks</h2>
              <span className="status-pill neutral">{engineering.tasks.length}</span>
            </div>
            {engineering.tasks.length === 0 ? (
              <p className="empty-state">Ainda não existem tasks.</p>
            ) : (
              <div className="stack-list">
                {engineering.tasks.map((task) => (
                  <div key={task.id} className="stack-item">
                    <div>
                      <strong>{task.title}</strong>
                      {task.ownerLabel ? <small>{task.ownerLabel}</small> : null}
                      {task.projectId ? <small>Project: {task.projectId}</small> : null}
                    </div>
                    <div className="stack-meta">
                      <span className={`priority-badge ${task.priority}`}>
                        {priorityLabels[task.priority]}
                      </span>
                      <span className={`status-pill ${task.completed ? "live" : "neutral"}`}>
                        {task.completed ? "Completed" : "Pending"}
                      </span>
                      {formatDate(task.dueDate) ? (
                        <small>
                          Due: <time dateTime={task.dueDate ?? undefined}>{formatDate(task.dueDate)}</time>
                        </small>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
