"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDelete from "@/components/ops/crud/ConfirmDelete";
import FormActions from "@/components/ops/crud/FormActions";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  focus: string | null;
  active: boolean;
};

type TeamCrudClientProps = {
  teamMembers: TeamMember[];
  canDelete: boolean;
  initialError?: string;
};

type FormState = {
  name: string;
  role: string;
  focus: string;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  role: "",
  focus: "",
  active: true,
};

export default function TeamCrudClient({
  teamMembers,
  canDelete,
  initialError = "",
}: TeamCrudClientProps) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<TeamMember | null>(null);

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

  function openEdit(member: TeamMember) {
    setEditing(member);
    setForm({
      name: member.name,
      role: member.role,
      focus: member.focus ?? "",
      active: member.active,
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
    const role = form.role.trim();
    const focus = form.focus.trim();

    if (!name) {
      setError("O nome é obrigatório.");
      return;
    }

    if (!role) {
      setError("O cargo é obrigatório.");
      return;
    }

    if (name.length > 200) {
      setError("O nome não pode ultrapassar 200 caracteres.");
      return;
    }

    if (role.length > 150) {
      setError("O cargo não pode ultrapassar 150 caracteres.");
      return;
    }

    if (focus.length > 500) {
      setError("O foco não pode ultrapassar 500 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        editing ? `/api/ops/team/${editing.id}` : "/api/ops/team",
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            role,
            focus: focus || null,
            active: form.active,
          }),
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload && typeof payload.error === "string"
            ? payload.error
            : "Não foi possível guardar o membro da equipa.",
        );
      }

      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      setSuccess(
        editing
          ? "Membro da equipa actualizado com sucesso."
          : "Membro da equipa criado com sucesso.",
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar o membro da equipa.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(member: TeamMember) {
    setError("");
    setSuccess("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/ops/team/${member.id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload && typeof payload.error === "string"
            ? payload.error
            : "Não foi possível eliminar o membro da equipa.",
        );
      }

      setDeleting(null);
      setSuccess("Membro da equipa eliminado com sucesso.");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível eliminar o membro da equipa.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="ops-card">
      <div className="card-header-row">
        <h2>Team</h2>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span className="status-pill neutral">Core functions</span>

          <button type="button" className="btn-primary" onClick={openCreate}>
            + Novo membro
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
            <h3>{editing ? "Editar membro" : "Novo membro"}</h3>
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
                placeholder="Nome completo"
                maxLength={200}
                disabled={isSubmitting}
              />
            </label>

            <label>
              <span>Cargo *</span>
              <input
                className="input"
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
                placeholder="Ex.: CEO"
                maxLength={150}
                disabled={isSubmitting}
              />
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              <span>Área / foco</span>
              <input
                className="input"
                value={form.focus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    focus: event.target.value,
                  }))
                }
                placeholder="Ex.: Company direction and NZoCHAIN narrative"
                maxLength={500}
                disabled={isSubmitting}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
                disabled={isSubmitting}
              />
              <span>Activo</span>
            </label>
          </div>

          <div style={{ marginTop: 18 }}>
            <FormActions
              submitLabel={editing ? "Guardar alterações" : "Criar membro"}
              isSubmitting={isSubmitting}
              onCancel={closeForm}
            />
          </div>
        </form>
      ) : null}

      {!error && teamMembers.length === 0 ? (
        <p className="empty-state">
          Ainda não existem membros na equipa.
        </p>
      ) : null}

      {teamMembers.length > 0 ? (
        <div className="team-grid" style={{ marginTop: 18 }}>
          {teamMembers.map((member) => (
            <div key={member.id}>
              <article className="team-card">
                <div className="avatar">
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>

                <strong>{member.name}</strong>

                <span>{member.role}</span>

                {member.focus ? <small>{member.focus}</small> : null}

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => openEdit(member)}
                  >
                    Editar
                  </button>

                  {canDelete ? (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        setDeleting(member);
                        setError("");
                        setSuccess("");
                      }}
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>
              </article>

              {deleting?.id === member.id ? (
                <ConfirmDelete
                  message={`Tem a certeza de que pretende eliminar "${member.name}"?`}
                  isDeleting={isDeleting}
                  onCancel={() => setDeleting(null)}
                  onConfirm={() => handleDelete(member)}
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
