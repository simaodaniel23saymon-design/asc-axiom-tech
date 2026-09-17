"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDelete from "@/components/ops/crud/ConfirmDelete";
import FormActions from "@/components/ops/crud/FormActions";
import FormFeedback from "@/components/ops/crud/FormFeedback";

export type GoalItem = {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  target: string | null;
  status:
    | "not_started"
    | "in_progress"
    | "on_track"
    | "at_risk"
    | "completed";
  deadline: string | null;
};

type FormState = {
  title: string;
  description: string;
  progress: string;
  target: string;
  status: GoalItem["status"];
  deadline: string;
};

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  progress: "0",
  target: "",
  status: "not_started",
  deadline: "",
});

const statusLabels: Record<GoalItem["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  on_track: "On track",
  at_risk: "At risk",
  completed: "Completed",
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

export default function GoalsCrudClient({
  goals,
  canDelete,
  initialError,
}: {
  goals: GoalItem[];
  canDelete: boolean;
  initialError: string | null;
}) {
  const router = useRouter();

  const [editing, setEditing] = useState<GoalItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleting, setDeleting] = useState<GoalItem | null>(null);
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

  const openEdit = (goal: GoalItem) => {
    setEditing(goal);
    setIsCreating(false);

    setForm({
      title: goal.title,
      description: goal.description ?? "",
      progress: String(goal.progress),
      target: goal.target ?? "",
      status: goal.status,
      deadline: dateInput(goal.deadline),
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

    const title = form.title.trim();
    const progress = Number(form.progress);

    if (!title || title.length > 200) {
      setError(
        "O título do objectivo deve ter entre 1 e 200 caracteres.",
      );
      return;
    }

    if (form.description.length > 2000) {
      setError("A descrição não pode exceder 2.000 caracteres.");
      return;
    }

    if (form.target.length > 500) {
      setError("O target não pode exceder 500 caracteres.");
      return;
    }

    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      setError(
        "O progresso deve ser um número inteiro entre 0 e 100.",
      );
      return;
    }

    const payload = {
      title,
      ...(form.description.trim()
        ? { description: form.description.trim() }
        : editing
          ? { description: null }
          : {}),
      progress,
      ...(form.target.trim()
        ? { target: form.target.trim() }
        : editing
          ? { target: null }
          : {}),
      status: form.status,
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
          ? "/api/ops/goals/" + editing.id
          : "/api/ops/goals",
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
              ? "Não foi possível actualizar o objectivo."
              : "Não foi possível criar o objectivo.",
          ),
        );
      }

      setSuccess(
        editing
          ? "Objectivo actualizado com sucesso."
          : "Objectivo criado com sucesso.",
      );

      closeForm();
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível guardar o objectivo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeGoal() {
    if (!deleting) return;

    setError(null);
    setSuccess(null);
    setIsDeleting(true);

    try {
      const response = await fetch(
        "/api/ops/goals/" + deleting.id,
        {
          method: "DELETE",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          apiError(
            data,
            "Não foi possível eliminar o objectivo.",
          ),
        );
      }

      setDeleting(null);
      setSuccess("Objectivo eliminado com sucesso.");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível eliminar o objectivo.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const showForm = isCreating || editing !== null;

  return (
    <section className="ops-card">
      <div className="card-header-row">
        <h2>Company goals</h2>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span className="status-pill neutral">Strategic</span>

          <button
            type="button"
            className="btn-primary"
            onClick={openCreate}
          >
            Novo objectivo
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
            {editing ? "Editar objectivo" : "Novo objectivo"}
          </h3>

          <label>
            <span>Título</span>

            <input
              value={form.title}
              onChange={(event) =>
                update("title", event.target.value)
              }
              maxLength={200}
              required
            />
          </label>

          <label>
            <span>Descrição</span>

            <textarea
              value={form.description}
              onChange={(event) =>
                update("description", event.target.value)
              }
              maxLength={2000}
              rows={3}
            />
          </label>

          <div className="grid-3">
            <label>
              <span>Progresso (%)</span>

              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.progress}
                onChange={(event) =>
                  update("progress", event.target.value)
                }
                required
              />
            </label>

            <label>
              <span>Estado</span>

              <select
                value={form.status}
                onChange={(event) =>
                  update("status", event.target.value)
                }
              >
                {Object.entries(statusLabels).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>Deadline</span>

              <input
                type="date"
                value={form.deadline}
                onChange={(event) =>
                  update("deadline", event.target.value)
                }
              />
            </label>
          </div>

          <label>
            <span>Target</span>

            <input
              value={form.target}
              onChange={(event) =>
                update("target", event.target.value)
              }
              maxLength={500}
            />
          </label>

          <FormActions
            submitLabel={
              isSubmitting
                ? editing
                  ? "A actualizar…"
                  : "A guardar…"
                : editing
                  ? "Actualizar objectivo"
                  : "Criar objectivo"
            }
            isSubmitting={isSubmitting}
            onCancel={closeForm}
          />
        </form>
      ) : null}

      {!error && goals.length === 0 ? (
        <p className="empty-state">
          Ainda não existem objectivos.
        </p>
      ) : null}

      {goals.length > 0 ? (
        <div className="goal-list expanded">
          {goals.map((goal) => (
            <div key={goal.id} className="goal-row">
              <div className="goal-header">
                <span>{goal.title}</span>
                <strong>{goal.progress}%</strong>
              </div>

              <div className="progress-track large">
                <span
                  style={{
                    width: `${goal.progress}%`,
                  }}
                />
              </div>

              <span className="status-pill neutral">
                {statusLabels[goal.status]}
              </span>

              {goal.description ? (
                <small>{goal.description}</small>
              ) : null}

              {goal.target ? (
                <small>{goal.target}</small>
              ) : null}

              {formatDate(goal.deadline) ? (
                <small>
                  Deadline:{" "}
                  <time dateTime={goal.deadline ?? undefined}>
                    {formatDate(goal.deadline)}
                  </time>
                </small>
              ) : null}

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 10,
                }}
              >
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => openEdit(goal)}
                >
                  Editar
                </button>

                {canDelete ? (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setDeleting(goal);
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
                {deleting?.id === goal.id ? (
                <ConfirmDelete
                message={
                  "Eliminar “" +
                  deleting.title +
                  "” irá remover este objectivo e o respectivo registo do histórico permanecerá associado à operação."
                  }
                  isDeleting={isDeleting}
              onCancel={() => setDeleting(null)}
              onConfirm={removeGoal}
              />
            ) : null}

            </div>
          ))}
        </div>
      ) : null}

    </section>
  );
}
