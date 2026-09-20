"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDelete from "@/components/ops/crud/ConfirmDelete";
import FormActions from "@/components/ops/crud/FormActions";

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

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "team" | "investor";
  status: string;
};

type Roadmap = {
  id: string;
  phase: string;
  title: string;
  description: string | null;
  status: string;
  priority: Priority;
  startDate: string | null;
  deadline: string | null;
};

type Project = {
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

type Milestone = {
  id: string;
  projectId: string | null;
  roadmapId: string | null;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  progress: number;
  dueDate: string | null;
};

type Task = {
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

type EngineeringCrudClientProps = {
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  users: User[];
  roadmaps: Roadmap[];
  canDelete: boolean;
  initialError?: string;
};

type ProjectForm = {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  progress: string;
  ownerId: string;
  ownerLabel: string;
  startDate: string;
  deadline: string;
};

type MilestoneForm = {
  projectId: string;
  roadmapId: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  progress: string;
  dueDate: string;
};

type TaskForm = {
  projectId: string;
  milestoneId: string;
  title: string;
  description: string;
  ownerId: string;
  ownerLabel: string;
  priority: Priority;
  completed: boolean;
  dueDate: string;
};

const emptyProjectForm: ProjectForm = {
  name: "",
  description: "",
  status: "planning",
  priority: "medium",
  progress: "0",
  ownerId: "",
  ownerLabel: "",
  startDate: "",
  deadline: "",
};

const emptyMilestoneForm: MilestoneForm = {
  projectId: "",
  roadmapId: "",
  title: "",
  description: "",
  status: "planned",
  progress: "0",
  dueDate: "",
};

const emptyTaskForm: TaskForm = {
  projectId: "",
  milestoneId: "",
  title: "",
  description: "",
  ownerId: "",
  ownerLabel: "",
  priority: "medium",
  completed: false,
  dueDate: "",
};

const projectStatusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In progress",
  review: "Review",
  live: "Live",
  completed: "Completed",
  blocked: "Blocked",
};

const milestoneStatusLabels: Record<MilestoneStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  review: "Review",
  completed: "Completed",
  blocked: "Blocked",
};

const priorityLabels: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function toDateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function toIsoDate(value: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function formatDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function EngineeringCrudClient({
  projects,
  milestones,
  tasks,
  users,
  roadmaps,
  canDelete,
  initialError = "",
}: EngineeringCrudClientProps) {
  const router = useRouter();

  const [projectForm, setProjectForm] =
    useState<ProjectForm>(emptyProjectForm);
  const [milestoneForm, setMilestoneForm] =
    useState<MilestoneForm>(emptyMilestoneForm);
  const [taskForm, setTaskForm] = useState<TaskForm>(emptyTaskForm);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingMilestone, setEditingMilestone] =
    useState<Milestone | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deletingMilestone, setDeletingMilestone] =
    useState<Milestone | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState("");

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function openCreateProject() {
    setEditingProject(null);
    setProjectForm(emptyProjectForm);
    resetMessages();
    setShowProjectForm(true);
  }

  function openEditProject(project: Project) {
    setEditingProject(project);

    setProjectForm({
      name: project.name,
      description: project.description ?? "",
      status: project.status,
      priority: project.priority,
      progress: String(project.progress),
      ownerId: project.ownerId ?? "",
      ownerLabel: project.responsible ?? "",
      startDate: toDateTimeLocal(project.startDate),
      deadline: toDateTimeLocal(project.deadline),
    });

    resetMessages();
    setShowProjectForm(true);
  }

  function openCreateMilestone() {
    setEditingMilestone(null);
    setMilestoneForm(emptyMilestoneForm);
    resetMessages();
    setShowMilestoneForm(true);
  }

  function openEditMilestone(milestone: Milestone) {
    setEditingMilestone(milestone);

    setMilestoneForm({
      projectId: milestone.projectId ?? "",
      roadmapId: milestone.roadmapId ?? "",
      title: milestone.title,
      description: milestone.description ?? "",
      status: milestone.status,
      progress: String(milestone.progress),
      dueDate: toDateTimeLocal(milestone.dueDate),
    });

    resetMessages();
    setShowMilestoneForm(true);
  }

  function openCreateTask() {
    setEditingTask(null);
    setTaskForm(emptyTaskForm);
    resetMessages();
    setShowTaskForm(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);

    setTaskForm({
      projectId: task.projectId ?? "",
      milestoneId: task.milestoneId ?? "",
      title: task.title,
      description: task.description ?? "",
      ownerId: task.ownerId ?? "",
      ownerLabel: task.ownerLabel ?? "",
      priority: task.priority,
      completed: task.completed,
      dueDate: toDateTimeLocal(task.dueDate),
    });

    resetMessages();
    setShowTaskForm(true);
  }

  function closeForms() {
    if (isSubmitting) return;

    setShowProjectForm(false);
    setShowMilestoneForm(false);
    setShowTaskForm(false);

    setEditingProject(null);
    setEditingMilestone(null);
    setEditingTask(null);
  }

  async function submitRequest(
    url: string,
    method: "POST" | "PUT",
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload && typeof payload.error === "string"
            ? payload.error
            : "Não foi possível guardar os dados.",
        );
      }

      closeForms();
      setSuccess(successMessage);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar os dados.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProjectSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const name = projectForm.name.trim();
    const description = projectForm.description.trim();
    const ownerLabel = projectForm.ownerLabel.trim();
    const progress = Number(projectForm.progress);

    if (!name) {
      setError("O nome do projecto é obrigatório.");
      return;
    }

    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      setError("O progresso deve estar entre 0 e 100.");
      return;
    }

    if (
      (projectForm.startDate &&
        Number.isNaN(new Date(projectForm.startDate).getTime())) ||
      (projectForm.deadline &&
        Number.isNaN(new Date(projectForm.deadline).getTime()))
    ) {
      setError("Uma das datas do projecto é inválida.");
      return;
    }

    await submitRequest(
      editingProject
        ? `/api/ops/engineering/projects/${editingProject.id}`
        : "/api/ops/engineering",
      editingProject ? "PUT" : "POST",
      {
        entity: "project",
        data: {
          name,
          description: description || null,
          status: projectForm.status,
          priority: projectForm.priority,
          progress,
          ownerId: projectForm.ownerId || null,
          ownerLabel: ownerLabel || null,
          startDate: toIsoDate(projectForm.startDate),
          deadline: toIsoDate(projectForm.deadline),
        },
      },
      editingProject
        ? "Projecto actualizado com sucesso."
        : "Projecto criado com sucesso.",
    );
  }

  async function handleMilestoneSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const title = milestoneForm.title.trim();
    const description = milestoneForm.description.trim();
    const progress = Number(milestoneForm.progress);

    if (!title) {
      setError("O título do milestone é obrigatório.");
      return;
    }

    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      setError("O progresso do milestone deve estar entre 0 e 100.");
      return;
    }

    if (
      milestoneForm.dueDate &&
      Number.isNaN(new Date(milestoneForm.dueDate).getTime())
    ) {
      setError("A data do milestone é inválida.");
      return;
    }

    await submitRequest(
      editingMilestone
        ? `/api/ops/engineering/milestones/${editingMilestone.id}`
        : "/api/ops/engineering",
      editingMilestone ? "PUT" : "POST",
      {
        entity: "milestone",
        data: {
          projectId: milestoneForm.projectId || null,
          roadmapId: milestoneForm.roadmapId || null,
          title,
          description: description || null,
          status: milestoneForm.status,
          progress: Number(progress),
          dueDate: toIsoDate(milestoneForm.dueDate),
        },
      },
      editingMilestone
        ? "Milestone actualizado com sucesso."
        : "Milestone criado com sucesso.",
    );
  }

  async function handleTaskSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = taskForm.title.trim();
    const description = taskForm.description.trim();
    const ownerLabel = taskForm.ownerLabel.trim();

    await submitRequest(
      editingTask
        ? `/api/ops/engineering/tasks/${editingTask.id}`
        : "/api/ops/engineering",
      editingTask ? "PUT" : "POST",
      {
        entity: "task",
        data: {
          projectId: taskForm.projectId || null,
          milestoneId: taskForm.milestoneId || null,
          title,
          description: description || null,
          ownerId: taskForm.ownerId || null,
          ownerLabel: ownerLabel || null,
          priority: taskForm.priority,
          completed: taskForm.completed,
          dueDate: toIsoDate(taskForm.dueDate),
        },
      },
      editingTask
        ? "Task actualizada com sucesso."
        : "Task criada com sucesso.",
    );
  }

  async function handleDelete(
    entity: "project" | "milestone" | "task",
    id: string,
  ) {
    setError("");
    setSuccess("");
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/ops/engineering/${entity}s/${id}`,
        {
          method: "DELETE",
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload && typeof payload.error === "string"
            ? payload.error
            : "Não foi possível eliminar o registo.",
        );
      }

      setDeletingProject(null);
      setDeletingMilestone(null);
      setDeletingTask(null);

      const labels = {
        project: "Projecto",
        milestone: "Milestone",
        task: "Task",
      };

      setSuccess(`${labels[entity]} eliminado com sucesso.`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível eliminar o registo.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const selectedTaskMilestones = taskForm.projectId
    ? milestones.filter(
        (milestone) => milestone.projectId === taskForm.projectId,
      )
    : milestones;

  return (
    <div className="ops-page">
      <section className="ops-card">
        <div className="card-header-row">
          <div>
            <h2>Engineering</h2>
            <small>Gestão operacional de projectos, milestones e tasks.</small>
          </div>

          <span className="status-pill neutral">CRUD</span>
        </div>

        {error ? <p className="empty-state">{error}</p> : null}

        {success ? (
          <p
            className="empty-state"
            style={{ borderColor: "rgba(34,197,94,.35)" }}
          >
            {success}
          </p>
        ) : null}
      </section>

      <section className="ops-card">
        <div className="card-header-row">
          <h2>Projects</h2>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span className="status-pill neutral">
              {projects.length}
            </span>

            <button
              type="button"
              className="btn-primary"
              onClick={openCreateProject}
            >
              + Novo projecto
            </button>
          </div>
        </div>

        {showProjectForm ? (
          <form
            onSubmit={handleProjectSubmit}
            className="ops-card"
            style={{ marginBottom: 18 }}
          >
            <div className="card-header-row">
              <h3>
                {editingProject ? "Editar projecto" : "Novo projecto"}
              </h3>
            </div>

            <div className="form-grid">
              <label>
                <span>Nome *</span>
                <input
                  className="input"
                  value={projectForm.name}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      name: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>

              <label>
                <span>Estado</span>
                <select
                  value={projectForm.status}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      status: event.target.value as ProjectStatus,
                    })
                  }
                  disabled={isSubmitting}
                >
                  {Object.entries(projectStatusLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>Prioridade</span>
                <select
                  value={projectForm.priority}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      priority: event.target.value as Priority,
                    })
                  }
                  disabled={isSubmitting}
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Progresso (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  value={projectForm.progress}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      progress: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>

              <label>
                <span>Responsável</span>
                <select
                  value={projectForm.ownerId}
                  onChange={(event) => {
                    const ownerId = event.target.value;
                    const owner = users.find((user) => user.id === ownerId);

                    setProjectForm({
                      ...projectForm,
                      ownerId,
                      ownerLabel: owner?.name ?? "",
                    });
                  }}
                  disabled={isSubmitting}
                >
                  <option value="">Sem responsável</option>
                  {users
                    .filter((user) => user.status === "active")
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} — {user.role}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                <span>Nome do responsável</span>
                <input
                  className="input"
                  value={projectForm.ownerLabel}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      ownerLabel: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>

              <label>
                <span>Início</span>
                <input
                  type="datetime-local"
                  className="input"
                  value={projectForm.startDate}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      startDate: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>

              <label>
                <span>Deadline</span>
                <input
                  type="datetime-local"
                  className="input"
                  value={projectForm.deadline}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      deadline: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                <span>Descrição</span>
                <textarea
                  value={projectForm.description}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      description: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>
            </div>

            <FormActions
              submitLabel={editingProject ? "Actualizar projecto" : "Criar projecto"}
              onCancel={closeForms}
              isSubmitting={isSubmitting}
            />
          </form>
        ) : null}

        {projects.length === 0 ? (
          <p className="empty-state">Ainda não existem projectos.</p>
        ) : (
          <div className="engineering-project-grid">
            {projects.map((project) => (
              <article key={project.id} className="engineering-project-card">
                <div className="engineering-project-header">
                  <div className="engineering-project-identity">
                    <strong>{project.name}</strong>

                    <div className="engineering-project-badges">
                      <span className="status-pill neutral">
                        {projectStatusLabels[project.status]}
                      </span>

                      <span className={`priority-badge ${project.priority}`}>
                        {priorityLabels[project.priority]}
                      </span>
                    </div>
                  </div>
                </div>

                {project.description ? (
                  <p className="engineering-project-description">
                    {project.description}
                  </p>
                ) : null}

                <div className="engineering-project-details">
                  {project.responsible ? (
                    <div className="engineering-project-detail">
                      <span>Responsável</span>
                      <strong>{project.responsible}</strong>
                    </div>
                  ) : null}

                  {formatDate(project.startDate) ? (
                    <div className="engineering-project-detail">
                      <span>Início</span>
                      <time dateTime={project.startDate ?? undefined}>
                        {formatDate(project.startDate)}
                      </time>
                    </div>
                  ) : null}

                  {formatDate(project.deadline) ? (
                    <div className="engineering-project-detail">
                      <span>Prazo</span>
                      <time dateTime={project.deadline ?? undefined}>
                        {formatDate(project.deadline)}
                      </time>
                    </div>
                  ) : null}
                </div>

                <div className="engineering-project-progress">
                  <div className="engineering-project-progress-header">
                    <span>Progresso</span>
                    <strong>{project.progress}%</strong>
                  </div>

                  <div className="ops-progress-track" aria-hidden="true">
                    <div
                      className="ops-progress-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, project.progress))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="engineering-project-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => openEditProject(project)}
                  >
                    Editar
                  </button>

                  {canDelete ? (
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => setDeletingProject(project)}
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="ops-card">
        <div className="card-header-row">
          <h2>Milestones</h2>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span className="status-pill neutral">
              {milestones.length}
            </span>

            <button
              type="button"
              className="btn-primary"
              onClick={openCreateMilestone}
            >
              + Novo milestone
            </button>
          </div>
        </div>

        {showMilestoneForm ? (
          <form
            onSubmit={handleMilestoneSubmit}
            className="ops-card"
            style={{ marginBottom: 18 }}
          >
            <div className="card-header-row">
              <h3>
                {editingMilestone ? "Editar milestone" : "Novo milestone"}
              </h3>
            </div>

            <div className="form-grid">
              <label>
                <span>Título *</span>
                <input
                  className="input"
                  value={milestoneForm.title}
                  onChange={(event) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      title: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>

              <label>
                <span>Projecto</span>
                <select
                  value={milestoneForm.projectId}
                  onChange={(event) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      projectId: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                >
                  <option value="">Sem projecto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Roadmap</span>
                <select
                  value={milestoneForm.roadmapId}
                  onChange={(event) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      roadmapId: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                >
                  <option value="">Sem roadmap</option>
                  {roadmaps.map((roadmap) => (
                    <option key={roadmap.id} value={roadmap.id}>
                      {roadmap.phase} — {roadmap.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Estado</span>
                <select
                  value={milestoneForm.status}
                  onChange={(event) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      status: event.target.value as MilestoneStatus,
                    })
                  }
                  disabled={isSubmitting}
                >
                  {Object.entries(milestoneStatusLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>Progresso (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  value={milestoneForm.progress}
                  onChange={(event) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      progress: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>

              <label>
                <span>Data limite</span>
                <input
                  type="datetime-local"
                  className="input"
                  value={milestoneForm.dueDate}
                  onChange={(event) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      dueDate: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                <span>Descrição</span>
                <textarea
                  value={milestoneForm.description}
                  onChange={(event) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      description: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>
            </div>

            <FormActions
              submitLabel={editingMilestone ? "Actualizar milestone" : "Criar milestone"}
              onCancel={closeForms}
              isSubmitting={isSubmitting}
            />
          </form>
        ) : null}

        {milestones.length === 0 ? (
          <p className="empty-state">Ainda não existem milestones.</p>
        ) : (
          <div className="engineering-milestone-grid">
            {milestones.map((milestone) => {
              const project = projects.find(
                (item) => item.id === milestone.projectId,
              );

              return (
                <article
                  key={milestone.id}
                  className="engineering-milestone-card"
                >
                  <div className="engineering-milestone-header">
                    <div className="engineering-milestone-identity">
                      <strong>{milestone.title}</strong>

                      <div className="engineering-milestone-badges">
                        <span className="status-pill neutral">
                          {milestoneStatusLabels[milestone.status]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {project ? (
                    <div className="engineering-milestone-project">
                      <span>Projecto</span>
                      <strong>{project.name}</strong>
                    </div>
                  ) : null}

                  {milestone.description ? (
                    <p className="engineering-milestone-description">
                      {milestone.description}
                    </p>
                  ) : null}

                  <div className="engineering-milestone-progress">
                    <div className="engineering-milestone-progress-header">
                      <span>Progresso</span>
                      <strong>{milestone.progress}%</strong>
                    </div>

                    <div className="ops-progress-track" aria-hidden="true">
                      <div
                        className="ops-progress-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, milestone.progress),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {formatDate(milestone.dueDate) ? (
                    <div className="engineering-milestone-date">
                      <span>Data limite</span>
                      <time dateTime={milestone.dueDate ?? undefined}>
                        {formatDate(milestone.dueDate)}
                      </time>
                    </div>
                  ) : null}

                  <div className="engineering-milestone-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => openEditMilestone(milestone)}
                    >
                      Editar
                    </button>

                    {canDelete ? (
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => setDeletingMilestone(milestone)}
                      >
                        Eliminar
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="ops-card">
        <div className="card-header-row">
          <h2>Tasks</h2>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span className="status-pill neutral">{tasks.length}</span>

            <button
              type="button"
              className="btn-primary"
              onClick={openCreateTask}
            >
              + Nova task
            </button>
          </div>
        </div>

        {showTaskForm ? (
          <form
            onSubmit={handleTaskSubmit}
            className="ops-card"
            style={{ marginBottom: 18 }}
          >
            <div className="card-header-row">
              <h3>{editingTask ? "Editar task" : "Nova task"}</h3>
            </div>

            <div className="form-grid">
              <label>
                <span>Título *</span>
                <input
                  className="input"
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      title: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>

              <label>
                <span>Prioridade</span>
                <select
                  value={taskForm.priority}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      priority: event.target.value as Priority,
                    })
                  }
                  disabled={isSubmitting}
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Projecto</span>
                <select
                  value={taskForm.projectId}
                  onChange={(event) => {
                    const projectId = event.target.value;

                    setTaskForm({
                      ...taskForm,
                      projectId,
                      milestoneId: milestones.some(
                        (milestone) =>
                          milestone.id === taskForm.milestoneId &&
                          milestone.projectId === projectId,
                      )
                        ? taskForm.milestoneId
                        : "",
                    });
                  }}
                  disabled={isSubmitting}
                >
                  <option value="">Sem projecto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Milestone</span>
                <select
                  value={taskForm.milestoneId}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      milestoneId: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                >
                  <option value="">Sem milestone</option>
                  {selectedTaskMilestones.map((milestone) => (
                    <option key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Responsável</span>
                <select
                  value={taskForm.ownerId}
                  onChange={(event) => {
                    const ownerId = event.target.value;
                    const owner = users.find((user) => user.id === ownerId);

                    setTaskForm({
                      ...taskForm,
                      ownerId,
                      ownerLabel: owner?.name ?? "",
                    });
                  }}
                  disabled={isSubmitting}
                >
                  <option value="">Sem responsável</option>
                  {users
                    .filter((user) => user.status === "active")
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} — {user.role}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                <span>Nome do responsável</span>
                <input
                  className="input"
                  value={taskForm.ownerLabel}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      ownerLabel: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>

              <label>
                <span>Data limite</span>
                <input
                  type="datetime-local"
                  className="input"
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      dueDate: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingTop: 28,
                }}
              >
                <input
                  type="checkbox"
                  checked={taskForm.completed}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      completed: event.target.checked,
                    })
                  }
                  disabled={isSubmitting}
                />
                <span>Task concluída</span>
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                <span>Descrição</span>
                <textarea
                  value={taskForm.description}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      description: event.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </label>
            </div>

            <FormActions
              submitLabel={editingTask ? "Actualizar task" : "Criar task"}
              onCancel={closeForms}
              isSubmitting={isSubmitting}
            />
          </form>
        ) : null}

        {tasks.length === 0 ? (
          <p className="empty-state">Ainda não existem tasks.</p>
        ) : (
          <div className="engineering-task-grid">
            {tasks.map((task) => {
              const project = projects.find(
                (item) => item.id === task.projectId,
              );
              const milestone = milestones.find(
                (item) => item.id === task.milestoneId,
              );

              return (
                <article
                  key={task.id}
                  className={`engineering-task-card ${
                    task.completed ? "completed" : ""
                  }`}
                >
                  <div className="engineering-task-header">
                    <div className="engineering-task-identity">
                      <div className="engineering-task-title-row">
                        <span
                          className={`engineering-task-check ${
                            task.completed ? "completed" : ""
                          }`}
                          aria-hidden="true"
                        >
                          {task.completed ? "✓" : "○"}
                        </span>

                        <strong>{task.title}</strong>
                      </div>

                      <div className="engineering-task-badges">
                        <span className={`priority-badge ${task.priority}`}>
                          {priorityLabels[task.priority]}
                        </span>

                        <span
                          className={`status-pill ${
                            task.completed ? "live" : "neutral"
                          }`}
                        >
                          {task.completed ? "Concluída" : "Pendente"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {task.description ? (
                    <p className="engineering-task-description">
                      {task.description}
                    </p>
                  ) : null}

                  <div className="engineering-task-details">
                    {project ? (
                      <div className="engineering-task-detail">
                        <span>Projecto</span>
                        <strong>{project.name}</strong>
                      </div>
                    ) : null}

                    {milestone ? (
                      <div className="engineering-task-detail">
                        <span>Milestone</span>
                        <strong>{milestone.title}</strong>
                      </div>
                    ) : null}

                    {task.ownerLabel ? (
                      <div className="engineering-task-detail">
                        <span>Responsável</span>
                        <strong>{task.ownerLabel}</strong>
                      </div>
                    ) : null}

                    {formatDate(task.dueDate) ? (
                      <div className="engineering-task-detail">
                        <span>Prazo</span>
                        <time dateTime={task.dueDate ?? undefined}>
                          {formatDate(task.dueDate)}
                        </time>
                      </div>
                    ) : null}
                  </div>

                  <div className="engineering-task-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => openEditTask(task)}
                    >
                      Editar
                    </button>

                    {canDelete ? (
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => setDeletingTask(task)}
                      >
                        Eliminar
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {canDelete && deletingProject ? (
        <ConfirmDelete
          message={`Tens a certeza que queres eliminar o projecto "${deletingProject.name}"?`}
          onConfirm={() =>
            handleDelete("project", deletingProject.id)
          }
          onCancel={() => setDeletingProject(null)}
          isDeleting={isDeleting}
        />
      ) : null}

      {canDelete && deletingMilestone ? (
        <ConfirmDelete
          message={`Tens a certeza que queres eliminar o milestone "${deletingMilestone.title}"?`}
          onConfirm={() =>
            handleDelete("milestone", deletingMilestone.id)
          }
          onCancel={() => setDeletingMilestone(null)}
          isDeleting={isDeleting}
        />
      ) : null}

      {canDelete && deletingTask ? (
        <ConfirmDelete
          message={`Tens a certeza que queres eliminar a task "${deletingTask.title}"?`}
          onConfirm={() => handleDelete("task", deletingTask.id)}
          onCancel={() => setDeletingTask(null)}
          isDeleting={isDeleting}
        />
      ) : null}
    </div>
  );
}
