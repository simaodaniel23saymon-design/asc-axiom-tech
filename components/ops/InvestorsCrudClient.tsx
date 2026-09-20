"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDelete from "@/components/ops/crud/ConfirmDelete";
import FormActions from "@/components/ops/crud/FormActions";

type InvestorStatus =
  | "prospect"
  | "contacted"
  | "meeting"
  | "due_diligence"
  | "committed"
  | "closed"
  | "inactive";

type Investor = {
  id: string;
  name: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  status: InvestorStatus;
  notes: string | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
};

type InvestorsCrudClientProps = {
  investors: Investor[];
  canDelete: boolean;
  initialError?: string;
};

type FormState = {
  name: string;
  organization: string;
  email: string;
  phone: string;
  status: InvestorStatus;
  notes: string;
  lastContactAt: string;
  nextFollowUpAt: string;
};

const emptyForm: FormState = {
  name: "",
  organization: "",
  email: "",
  phone: "",
  status: "prospect",
  notes: "",
  lastContactAt: "",
  nextFollowUpAt: "",
};

const statusLabels: Record<InvestorStatus, string> = {
  prospect: "Prospecto",
  contacted: "Contactado",
  meeting: "Reunião",
  due_diligence: "Due diligence",
  committed: "Comprometido",
  closed: "Fechado",
  inactive: "Inactivo",
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

export default function InvestorsCrudClient({
  investors,
  canDelete,
  initialError = "",
}: InvestorsCrudClientProps) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Investor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<Investor | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState("");

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setDeleting(null);
    setShowForm(true);
  }

  function openEdit(investor: Investor) {
    setEditing(investor);

    setForm({
      name: investor.name,
      organization: investor.organization ?? "",
      email: investor.email ?? "",
      phone: investor.phone ?? "",
      status: investor.status,
      notes: investor.notes ?? "",
      lastContactAt: toDateTimeLocal(investor.lastContactAt),
      nextFollowUpAt: toDateTimeLocal(investor.nextFollowUpAt),
    });

    setError("");
    setSuccess("");
    setDeleting(null);
    setShowForm(true);
  }

  function closeForm() {
    if (isSubmitting) return;

    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const organization = form.organization.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const notes = form.notes.trim();

    if (!name) {
      setError("O nome é obrigatório.");
      return;
    }

    if (name.length > 200) {
      setError("O nome não pode ultrapassar 200 caracteres.");
      return;
    }

    if (organization.length > 200) {
      setError("A organização não pode ultrapassar 200 caracteres.");
      return;
    }

    if (email.length > 320) {
      setError("O email não pode ultrapassar 320 caracteres.");
      return;
    }

    if (phone.length > 50) {
      setError("O telefone não pode ultrapassar 50 caracteres.");
      return;
    }

    if (notes.length > 2000) {
      setError("As notas não podem ultrapassar 2000 caracteres.");
      return;
    }

    if (
      form.lastContactAt &&
      Number.isNaN(new Date(form.lastContactAt).getTime())
    ) {
      setError("A data do último contacto é inválida.");
      return;
    }

    if (
      form.nextFollowUpAt &&
      Number.isNaN(new Date(form.nextFollowUpAt).getTime())
    ) {
      setError("A data do próximo contacto é inválida.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        editing
          ? `/api/ops/investors/${editing.id}`
          : "/api/ops/investors",
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            organization: organization || null,
            email: email || null,
            phone: phone || null,
            status: form.status,
            notes: notes || null,
            lastContactAt: toIsoDate(form.lastContactAt),
            nextFollowUpAt: toIsoDate(form.nextFollowUpAt),
          }),
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload && typeof payload.error === "string"
            ? payload.error
            : "Não foi possível guardar o investidor.",
        );
      }

      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      setSuccess(
        editing
          ? "Investidor actualizado com sucesso."
          : "Investidor criado com sucesso.",
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar o investidor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(investor: Investor) {
    setError("");
    setSuccess("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/ops/investors/${investor.id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload && typeof payload.error === "string"
            ? payload.error
            : "Não foi possível eliminar o investidor.",
        );
      }

      setDeleting(null);
      setSuccess("Investidor eliminado com sucesso.");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível eliminar o investidor.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="ops-card">
      <div className="card-header-row">
        <h2>Investors</h2>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span className="status-pill neutral">Pipeline</span>

          <button type="button" className="btn-primary" onClick={openCreate}>
            + Novo investidor
          </button>
        </div>
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

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="ops-card"
          style={{ marginTop: 18 }}
        >
          <div className="card-header-row">
            <h3>{editing ? "Editar investidor" : "Novo investidor"}</h3>
          </div>

          <div className="form-grid">
            <label>
              <span>Nome *</span>
              <input
                className="input"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Nome do investidor"
                maxLength={200}
                disabled={isSubmitting}
              />
            </label>

            <label>
              <span>Organização</span>
              <input
                className="input"
                value={form.organization}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    organization: event.target.value,
                  }))
                }
                placeholder="Empresa ou organização"
                maxLength={200}
                disabled={isSubmitting}
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="investidor@empresa.com"
                maxLength={320}
                disabled={isSubmitting}
              />
            </label>

            <label>
              <span>Telefone</span>
              <input
                type="tel"
                className="input"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="+244 ..."
                maxLength={50}
                disabled={isSubmitting}
              />
            </label>

            <label>
              <span>Estado</span>
              <select
                className="input"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as InvestorStatus,
                  }))
                }
                disabled={isSubmitting}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Último contacto</span>
              <input
                type="datetime-local"
                className="input"
                value={form.lastContactAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lastContactAt: event.target.value,
                  }))
                }
                disabled={isSubmitting}
              />
            </label>

            <label>
              <span>Próximo contacto</span>
              <input
                type="datetime-local"
                className="input"
                value={form.nextFollowUpAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nextFollowUpAt: event.target.value,
                  }))
                }
                disabled={isSubmitting}
              />
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              <span>Notas</span>
              <textarea
                className="input"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Notas sobre o investidor, reuniões ou próximos passos"
                maxLength={2000}
                rows={5}
                disabled={isSubmitting}
              />
            </label>
          </div>

          <div style={{ marginTop: 18 }}>
            <FormActions
              submitLabel={
                editing ? "Guardar alterações" : "Criar investidor"
              }
              isSubmitting={isSubmitting}
              onCancel={closeForm}
            />
          </div>
        </form>
      ) : null}

      {!error && investors.length === 0 ? (
        <p className="empty-state">
          Ainda não existem registos de investidores.
        </p>
      ) : null}

      {investors.length > 0 ? (
        <div className="stack-list" style={{ marginTop: 18 }}>
          {investors.map((investor) => (
            <div key={investor.id}>
              <article className="investor-card">
                <div className="investor-card-main">
                  <div className="investor-card-header">
                    <div className="investor-avatar" aria-hidden="true">
                      {investor.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>

                    <div className="investor-identity">
                      <strong>{investor.name}</strong>

                      {investor.organization ? (
                        <span>{investor.organization}</span>
                      ) : (
                        <span className="investor-muted">
                          Organização não definida
                        </span>
                      )}
                    </div>

                    <span
                      className={`investor-status investor-status-${investor.status}`}
                    >
                      <span aria-hidden="true">●</span>
                      {statusLabels[investor.status]}
                    </span>
                  </div>

                  {(investor.email || investor.phone) ? (
                    <div className="investor-contact">
                      {investor.email ? (
                        <span>
                          <b>Email</b>
                          {investor.email}
                        </span>
                      ) : null}

                      {investor.phone ? (
                        <span>
                          <b>Telefone</b>
                          {investor.phone}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {(formatDate(investor.lastContactAt) ||
                    formatDate(investor.nextFollowUpAt)) ? (
                    <div className="investor-dates">
                      {formatDate(investor.lastContactAt) ? (
                        <span>
                          <b>Último contacto</b>
                          <time
                            dateTime={investor.lastContactAt ?? undefined}
                          >
                            {formatDate(investor.lastContactAt)}
                          </time>
                        </span>
                      ) : null}

                      {formatDate(investor.nextFollowUpAt) ? (
                        <span>
                          <b>Próximo contacto</b>
                          <time
                            dateTime={investor.nextFollowUpAt ?? undefined}
                          >
                            {formatDate(investor.nextFollowUpAt)}
                          </time>
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {investor.notes ? (
                    <p className="investor-notes">{investor.notes}</p>
                  ) : (
                    <p className="investor-notes investor-notes-empty">
                      Sem notas registadas.
                    </p>
                  )}

                  <div className="investor-card-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => openEdit(investor)}
                    >
                      Editar
                    </button>

                    {canDelete ? (
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => {
                          setDeleting(investor);
                          setError("");
                          setSuccess("");
                        }}
                      >
                        Eliminar
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>

              {deleting?.id === investor.id ? (
                <ConfirmDelete
                  message={`Tem a certeza de que pretende eliminar "${investor.name}"?`}
                  isDeleting={isDeleting}
                  onCancel={() => setDeleting(null)}
                  onConfirm={() => handleDelete(investor)}
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
