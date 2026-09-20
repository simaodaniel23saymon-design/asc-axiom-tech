"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDelete from "@/components/ops/crud/ConfirmDelete";
import FormActions from "@/components/ops/crud/FormActions";
import FormFeedback from "@/components/ops/crud/FormFeedback";

export type RoadmapItem = {
  id: string;
  phase: string;
  title: string;
  status: "planned" | "in_progress" | "review" | "completed";
  description: string | null;
  priority: "high" | "medium" | "low";
  startDate: string | null;
  deadline: string | null;
};

type FormState = {
  phase: string;
  title: string;
  description: string;
  status: RoadmapItem["status"];
  priority: RoadmapItem["priority"];
  startDate: string;
  deadline: string;
};

const emptyForm = (): FormState => ({
  phase: "",
  title: "",
  description: "",
  status: "planned",
  priority: "medium",
  startDate: "",
  deadline: "",
});

const statusLabels: Record<RoadmapItem["status"], string> = {
  planned: "Planeado",
  in_progress: "Em andamento",
  review: "Em revisão",
  completed: "Concluído",
};

const priorityLabels: Record<RoadmapItem["priority"], string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

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

function dateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function apiError(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

export default function RoadmapCrudClient({
  roadmap,
  canDelete,
  initialError,
}: {
  roadmap: RoadmapItem[];
  canDelete: boolean;
  initialError: string | null;
}) {
  const router = useRouter();

  const [editing, setEditing] = useState<RoadmapItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleting, setDeleting] = useState<RoadmapItem | null>(null);
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

  const openEdit = (item: RoadmapItem) => {
    setEditing(item);
    setIsCreating(false);

    setForm({
      phase: item.phase,
      title: item.title,
      description: item.description ?? "",
      status: item.status,
      priority: item.priority,
      startDate: dateInput(item.startDate),
      deadline: dateInput(item.deadline),
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

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const phase = form.phase.trim();
    const title = form.title.trim();

    if (!phase || phase.length > 50) {
      setError(
        "A fase deve ter entre 1 e 50 caracteres.",
      );
      return;
    }

    if (!title || title.length > 200) {
      setError(
        "O título deve ter entre 1 e 200 caracteres.",
      );
      return;
    }

    if (form.description.length > 2000) {
      setError(
        "A descrição não pode exceder 2.000 caracteres.",
      );
      return;
    }

    const payload = {
      phase,
      title,
      ...(form.description.trim()
        ? { description: form.description.trim() }
        : editing
          ? { description: null }
          : {}),
      status: form.status,
      priority: form.priority,
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
        editing
          ? "/api/ops/roadmap/" + editing.id
          : "/api/ops/roadmap",
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          apiError(
            data,
            editing
              ? "Não foi possível actualizar a fase do roadmap."
              : "Não foi possível criar a fase do roadmap.",
          ),
        );
      }

      setSuccess(
        editing
          ? "Fase do roadmap actualizada com sucesso."
          : "Fase do roadmap criada com sucesso.",
      );

      closeForm();
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível guardar a fase do roadmap.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeRoadmap() {
    if (!deleting) return;

    setError(null);
    setSuccess(null);
    setIsDeleting(true);

    try {
      const response = await fetch(
        "/api/ops/roadmap/" + deleting.id,
        {
          method: "DELETE",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          apiError(
            data,
            "Não foi possível eliminar a fase do roadmap.",
          ),
        );
      }

      setDeleting(null);
      setSuccess("Fase do roadmap eliminada com sucesso.");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível eliminar a fase do roadmap.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const showForm = isCreating || editing !== null;

  return (
    <section className="ops-card">
      <div className="card-header-row">
        <h2>Roadmap</h2>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span className="ops-status neutral">
            Execution
          </span>

          <button
            type="button"
            className="btn-primary"
            onClick={openCreate}
          >
            Nova fase
          </button>
        </div>
      </div>

      <FormFeedback message={error} />
      <FormFeedback message={success} tone="success" />

      {showForm ? (
        <form
          onSubmit={submit}
          className="auth-form"
          style={{ marginBottom: 22 }}
        >
          <h3>
            {editing
              ? "Editar fase do roadmap"
              : "Nova fase do roadmap"}
          </h3>

          <div className="grid-3">
            <label>
              <span>Fase</span>
              <input
                value={form.phase}
                onChange={(event) =>
                  update("phase", event.target.value)
                }
                maxLength={50}
                placeholder="Ex.: Phase 1"
                required
              />
            </label>

            <label style={{ gridColumn: "span 2" }}>
              <span>Título</span>
              <input
                value={form.title}
                onChange={(event) =>
                  update("title", event.target.value)
                }
                maxLength={200}
                placeholder="Título da fase"
                required
              />
            </label>
          </div>

          <label>
            <span>Descrição</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                update("description", event.target.value)
              }
              maxLength={2000}
              rows={3}
              placeholder="Descrição da fase..."
            />
          </label>

          <div className="grid-3">
            <label>
              <span>Estado</span>
              <select
                value={form.status}
                onChange={(event) =>
                  update(
                    "status",
                    event.target.value,
                  )
                }
              >
                <option value="planned">Planeado</option>
                <option value="in_progress">Em andamento</option>
                <option value="review">Em revisão</option>
                <option value="completed">Concluído</option>
              </select>
            </label>

            <label>
              <span>Prioridade</span>
              <select
                value={form.priority}
                onChange={(event) =>
                  update(
                    "priority",
                    event.target.value,
                  )
                }
              >
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </label>

            <label>
              <span>Data de início</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  update(
                    "startDate",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <div className="grid-3">
            <label>
              <span>Prazo</span>
              <input
                type="date"
                value={form.deadline}
                onChange={(event) =>
                  update(
                    "deadline",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <FormActions
            isSubmitting={isSubmitting}
            onCancel={closeForm}
            submitLabel={
              editing
                ? "Guardar alterações"
                : "Criar fase"
            }
          />
        </form>
      ) : null}

      {!initialError && roadmap.length === 0 ? (
        <p className="ops-empty-state">
          Ainda não existem fases no roadmap.
        </p>
      ) : null}

      {roadmap.length > 0 ? (
        <div className="ops-roadmap-list">
          {roadmap.map((item, index) => (
            <div
              key={item.id}
              className="ops-roadmap-item"
            >
              <div className="ops-roadmap-phase">
                Fase {String(index + 1).padStart(2, "0")}
              </div>

              <div className="ops-roadmap-content">
                <div className="ops-roadmap-header">
                  <div className="ops-roadmap-title">
                    <strong>{item.title}</strong>

                    <div className="ops-roadmap-meta">
                      <span className="ops-status neutral">
                        {statusLabels[item.status]}
                      </span>

                      <span
                        className={`ops-status ${item.priority}`}
                      >
                        {priorityLabels[item.priority]}
                      </span>

                      {formatDate(item.startDate) ? (
                        <span className="ops-roadmap-date">
                          <span>Início</span>
                          <time
                            dateTime={
                              item.startDate ??
                              undefined
                            }
                          >
                            {formatDate(item.startDate)}
                          </time>
                        </span>
                      ) : null}

                      {formatDate(item.deadline) ? (
                        <span className="ops-roadmap-date">
                          <span>Prazo</span>
                          <time
                            dateTime={
                              item.deadline ??
                              undefined
                            }
                          >
                            {formatDate(item.deadline)}
                          </time>
                        </span>
                      ) : null}
                    </div>

                    {item.description ? (
                      <p className="ops-roadmap-description">
                        {item.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="ops-roadmap-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() =>
                        openEdit(item)
                      }
                    >
                      Editar
                    </button>

                    {canDelete ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setDeleting(item);
                          setError(null);
                          setSuccess(null);
                        }}
                      >
                        Eliminar
                      </button>
                    ) : null}
                  </div>
                </div>

                {deleting?.id === item.id ? (
                  <ConfirmDelete
                    message={
                      "Eliminar “" +
                      deleting.title +
                      "” irá remover esta fase do roadmap. O respectivo registo do histórico permanecerá associado à operação."
                    }
                    isDeleting={isDeleting}
                    onCancel={() =>
                      setDeleting(null)
                    }
                    onConfirm={removeRoadmap}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
