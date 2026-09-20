"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDelete from "@/components/ops/crud/ConfirmDelete";
import FormActions from "@/components/ops/crud/FormActions";
import FormFeedback from "@/components/ops/crud/FormFeedback";

export type ProjectItem = {
  id: string;
  name: string;
  description: string | null;
  status:
    | "planning"
    | "in_progress"
    | "review"
    | "live"
    | "completed"
    | "blocked";
  priority: "high" | "medium" | "low";
  progress: number;
  ownerLabel: string | null;
  startDate: string | null;
  deadline: string | null;
};
type FormState = {
  name: string;
  description: string;
  status: ProjectItem["status"];
  priority: ProjectItem["priority"];
  progress: string;
  ownerLabel: string;
  startDate: string;
  deadline: string;
};
const emptyForm = (): FormState => ({
  name: "",
  description: "",
  status: "planning",
  priority: "medium",
  progress: "0",
  ownerLabel: "",
  startDate: "",
  deadline: "",
});
const statusLabels: Record<ProjectItem["status"], string> = {
  planning: "Planeamento",
  in_progress: "Em andamento",
  review: "Em revisão",
  live: "Em produção",
  completed: "Concluído",
  blocked: "Bloqueado",
};
const priorityLabels: Record<ProjectItem["priority"], string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};
function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}
function dateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}
function apiError(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  )
    return payload.error;
  return fallback;
}

export default function ProjectsCrudClient({
  projects,
  canDelete,
  initialError,
}: {
  projects: ProjectItem[];
  canDelete: boolean;
  initialError: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ProjectItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<ProjectItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [success, setSuccess] = useState<string | null>(null);
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setIsCreating(true);
    setError(null);
    setSuccess(null);
  };
  const openEdit = (project: ProjectItem) => {
    setEditing(project);
    setIsCreating(false);
    setForm({
      name: project.name,
      description: project.description ?? "",
      status: project.status,
      priority: project.priority,
      progress: String(project.progress),
      ownerLabel: project.ownerLabel ?? "",
      startDate: dateInput(project.startDate),
      deadline: dateInput(project.deadline),
    });
    setError(null);
    setSuccess(null);
  };
  const closeForm = () => {
    setEditing(null);
    setIsCreating(false);
    setForm(emptyForm());
    setError(null);
  };
  const update = (field: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const name = form.name.trim();
    const progress = Number(form.progress);
    if (!name || name.length > 200)
      return setError("O nome do projecto deve ter entre 1 e 200 caracteres.");
    if (form.description.length > 2000)
      return setError("A descrição não pode exceder 2.000 caracteres.");
    if (form.ownerLabel.length > 200)
      return setError("O responsável não pode exceder 200 caracteres.");
    if (!Number.isInteger(progress) || progress < 0 || progress > 100)
      return setError("O progresso deve ser um número inteiro entre 0 e 100.");
    const payload = {
      name,
      ...(form.description.trim()
        ? { description: form.description.trim() }
        : editing
          ? { description: null }
          : {}),
      status: form.status,
      priority: form.priority,
      progress,
      ...(form.ownerLabel.trim()
        ? { ownerLabel: form.ownerLabel.trim() }
        : editing
          ? { ownerLabel: null }
          : {}),
      ...(form.startDate
        ? { startDate: form.startDate }
        : editing
          ? { startDate: null }
          : {}),
      ...(form.deadline
        ? { deadline: form.deadline }
        : editing
          ? { deadline: null }
          : {}),
    };
    setIsSubmitting(true);
    try {
      const response = await fetch(
        editing ? "/api/ops/projects/" + editing.id : "/api/ops/projects",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          apiError(
            data,
            editing
              ? "Não foi possível actualizar o projecto."
              : "Não foi possível criar o projecto.",
          ),
        );
      setSuccess(
        editing
          ? "Projecto actualizado com sucesso."
          : "Projecto criado com sucesso.",
      );
      closeForm();
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível guardar o projecto.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }
  async function removeProject() {
    if (!deleting) return;
    setError(null);
    setSuccess(null);
    setIsDeleting(true);
    try {
      const response = await fetch("/api/ops/projects/" + deleting.id, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          apiError(data, "Não foi possível eliminar o projecto."),
        );
      setDeleting(null);
      setSuccess("Projecto eliminado com sucesso.");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível eliminar o projecto.",
      );
    } finally {
      setIsDeleting(false);
    }
  }
  const showForm = isCreating || editing !== null;
  return (
    <section className="ops-card ops-projects">
      <div className="ops-projects-header">
        <div className="ops-projects-heading">
          <h2>Projectos</h2>
          <p>Gestão operacional do portefólio de projectos.</p>
        </div>

        <div className="ops-projects-header-actions">
          <span className="ops-status neutral">
            <i className="fa-solid fa-layer-group" aria-hidden="true" />
            Portefólio
          </span>

          <button
            type="button"
            className="ops-primary-button"
            onClick={openCreate}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            <span>Novo projecto</span>
          </button>
        </div>
      </div>
      <FormFeedback message={error} />
      <FormFeedback message={success} tone="success" />
      {showForm ? (
        <form onSubmit={submit} className="ops-project-form">
          <h3>{editing ? "Editar projecto" : "Criar novo projecto"}</h3>
          <label>
            <span>Nome</span>
            <input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              maxLength={200}
              required
            />
          </label>
          <label>
            <span>Descrição</span>
            <textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              maxLength={2000}
              rows={3}
            />
          </label>
          <div className="grid-3">
            <label>
              <span>Estado</span>
              <select
                value={form.status}
                onChange={(event) => update("status", event.target.value)}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Prioridade</span>
              <select
                value={form.priority}
                onChange={(event) => update("priority", event.target.value)}
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
                step="1"
                value={form.progress}
                onChange={(event) => update("progress", event.target.value)}
                required
              />
            </label>
          </div>
          <label>
            <span>Responsável</span>
            <input
              value={form.ownerLabel}
              onChange={(event) => update("ownerLabel", event.target.value)}
              maxLength={200}
            />
          </label>
          <div className="grid-2">
            <label>
              <span>Início</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => update("startDate", event.target.value)}
              />
            </label>
            <label>
              <span>Deadline</span>
              <input
                type="date"
                value={form.deadline}
                onChange={(event) => update("deadline", event.target.value)}
              />
            </label>
          </div>
          <FormActions
            submitLabel={
              isSubmitting
                ? editing
                  ? "A actualizar…"
                  : "A guardar…"
                : editing
                  ? "Actualizar projecto"
                  : "Criar projecto"
            }
            isSubmitting={isSubmitting}
            onCancel={closeForm}
          />
        </form>
      ) : null}
      {projects.length === 0 ? (
        <div className="ops-project-empty">
          <i className="fa-solid fa-folder-open" aria-hidden="true" />
          <p>Ainda não existem projectos.</p>
        </div>
      ) : (
        <div className="ops-project-list">
          {projects.map((project) => (
            <article key={project.id} className="ops-project-item">
              <div className="ops-project-main">
                <div className="ops-project-title-row">
                  <div>
                    <h3 className="ops-project-title">{project.name}</h3>

                    {project.description ? (
                      <p className="ops-project-description">
                        {project.description}
                      </p>
                    ) : null}

                    {project.ownerLabel ? (
                      <span className="ops-project-owner">
                        <i
                          className="fa-solid fa-user"
                          aria-hidden="true"
                        />
                        {project.ownerLabel}
                      </span>
                    ) : null}
                  </div>

                  <div className="ops-project-meta">
                    <span className={`ops-status ${project.status}`}>
                      {statusLabels[project.status]}
                    </span>

                    <span className={`priority-badge ${project.priority}`}>
                      {priorityLabels[project.priority]}
                    </span>
                  </div>
                </div>

                <div className="ops-project-progress">
                  <div className="ops-progress-header">
                    <span>Progresso</span>
                    <strong>{project.progress}%</strong>
                  </div>

                  <div
                    className="ops-progress-track"
                    role="progressbar"
                    aria-valuenow={project.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progresso de ${project.name}`}
                  >
                    <span
                      className="ops-progress-fill"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="ops-project-info">
                  {formatDate(project.startDate) ? (
                    <span className="ops-project-date">
                      <i
                        className="fa-solid fa-calendar-days"
                        aria-hidden="true"
                      />
                      <span>
                        Início:{" "}
                        <time dateTime={project.startDate ?? undefined}>
                          {formatDate(project.startDate)}
                        </time>
                      </span>
                    </span>
                  ) : null}

                  {formatDate(project.deadline) ? (
                    <span
                      className={
                        project.deadline &&
                        new Date(project.deadline).getTime() < Date.now() &&
                        project.status !== "completed" &&
                        project.status !== "live"
                          ? "ops-project-date overdue"
                          : "ops-project-date"
                      }
                    >
                      <i
                        className="fa-solid fa-calendar-xmark"
                        aria-hidden="true"
                      />
                      <span>
                        Deadline:{" "}
                        <time dateTime={project.deadline ?? undefined}>
                          {formatDate(project.deadline)}
                        </time>
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="ops-project-actions">
                <button
                  type="button"
                  className="ops-secondary-button"
                  onClick={() => openEdit(project)}
                >
                  <i className="fa-solid fa-pen" aria-hidden="true" />
                  <span>Editar</span>
                </button>

                {canDelete ? (
                  <button
                    type="button"
                    className="ops-secondary-button"
                    onClick={() => {
                      setDeleting(project);
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    <i className="fa-solid fa-trash" aria-hidden="true" />
                    <span>Eliminar</span>
                  </button>
                ) : null}
              </div>

              {deleting?.id === project.id ? (
                <div className="ops-project-delete">
                  <ConfirmDelete
                    message={
                      "Eliminar “" +
                      deleting.name +
                      "” irá remover este projecto. Os milestones associados serão eliminados e as tasks ficarão sem projecto."
                    }
                    isDeleting={isDeleting}
                    onCancel={() => setDeleting(null)}
                    onConfirm={removeProject}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
