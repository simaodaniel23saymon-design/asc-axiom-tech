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
  not_started: "Não iniciado",
  in_progress: "Em andamento",
  on_track: "No caminho certo",
  at_risk: "Em risco",
  completed: "Concluído",
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
    <section className="ops-card ops-goals">
      <div className="ops-goals-header">
        <div className="ops-goals-heading">
          <h2>Objectivos</h2>
          <p>Direcção estratégica e acompanhamento dos resultados.</p>
        </div>

        <div className="ops-goals-header-actions">
          <span className="ops-status planning">
            <i className="fa-solid fa-bullseye" aria-hidden="true" />
            Estratégico
          </span>

          <button
            type="button"
            className="ops-primary-button"
            onClick={openCreate}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            <span>Novo objectivo</span>
          </button>
        </div>
      </div>

      <FormFeedback message={error} />
      <FormFeedback message={success} tone="success" />

      {showForm ? (
        <form
          onSubmit={submit}
          className="ops-goal-form"
        >
          <div className="ops-goal-form-header">
            <div>
              <span className="eyebrow">
                {editing ? "Actualizar" : "Novo registo"}
              </span>
              <h3>
                {editing ? "Editar objectivo" : "Criar novo objectivo"}
              </h3>
            </div>

            <span className="ops-status neutral">
              <i className="fa-solid fa-bullseye" aria-hidden="true" />
              Objectivo estratégico
            </span>
          </div>

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
        <div className="ops-goal-empty">
          <i className="fa-solid fa-bullseye" aria-hidden="true" />
          <strong>Ainda não existem objectivos.</strong>
          <p>Cria o primeiro objectivo estratégico para começar o acompanhamento.</p>
        </div>
      ) : null}

      {goals.length > 0 ? (
        <div className="ops-goal-list">
          {goals.map((goal) => (
            <article key={goal.id} className="ops-goal-item">
              <div className="ops-goal-main">
                <div className="ops-goal-title-row">
                  <div className="ops-goal-title-block">
                    <h3>{goal.title}</h3>

                    {goal.description ? (
                      <p className="ops-goal-description">
                        {goal.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="ops-goal-status-group">
                    <span className={`ops-status ${goal.status}`}>
                      {goal.status === "at_risk" ? (
                        <i
                          className="fa-solid fa-triangle-exclamation"
                          aria-hidden="true"
                        />
                      ) : goal.status === "completed" ? (
                        <i
                          className="fa-solid fa-circle-check"
                          aria-hidden="true"
                        />
                      ) : goal.status === "on_track" ? (
                        <i
                          className="fa-solid fa-arrow-trend-up"
                          aria-hidden="true"
                        />
                      ) : (
                        <i
                          className="fa-solid fa-circle"
                          aria-hidden="true"
                        />
                      )}
                      {statusLabels[goal.status]}
                    </span>

                    <strong className="ops-goal-progress-value">
                      {goal.progress}%
                    </strong>
                  </div>
                </div>

                <div className="ops-goal-progress">
                  <div className="ops-progress-header">
                    <span>Progresso</span>
                    <strong>{goal.progress}%</strong>
                  </div>

                  <div
                    className="ops-progress-track"
                    role="progressbar"
                    aria-valuenow={goal.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progresso de ${goal.title}`}
                  >
                    <span
                      className="ops-progress-fill"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                <div className="ops-goal-details">
                  {goal.target ? (
                    <span>
                      <i
                        className="fa-solid fa-bullseye"
                        aria-hidden="true"
                      />
                      <span>
                        <strong>Target:</strong> {goal.target}
                      </span>
                    </span>
                  ) : null}

                  {formatDate(goal.deadline) ? (
                    <span
                      className={
                        goal.deadline &&
                        new Date(goal.deadline).getTime() < Date.now() &&
                        goal.status !== "completed"
                          ? "is-overdue"
                          : ""
                      }
                    >
                      <i
                        className="fa-solid fa-calendar-days"
                        aria-hidden="true"
                      />
                      <span>
                        <strong>Deadline:</strong>{" "}
                        <time dateTime={goal.deadline ?? undefined}>
                          {formatDate(goal.deadline)}
                        </time>
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="ops-goal-actions">
                <button
                  type="button"
                  className="ops-secondary-button"
                  onClick={() => openEdit(goal)}
                >
                  <i className="fa-solid fa-pen" aria-hidden="true" />
                  <span>Editar</span>
                </button>

                {canDelete ? (
                  <button
                    type="button"
                    className="ops-secondary-button"
                    onClick={() => {
                      setDeleting(goal);
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    <i className="fa-solid fa-trash" aria-hidden="true" />
                    <span>Eliminar</span>
                  </button>
                ) : null}
              </div>

              {deleting?.id === goal.id ? (
                <div className="ops-goal-delete">
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
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
