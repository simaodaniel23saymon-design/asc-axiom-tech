"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDelete from "@/components/ops/crud/ConfirmDelete";
import FormActions from "@/components/ops/crud/FormActions";

type SystemRole = "admin" | "team" | "investor";

type TeamMember = {
  id: string;
  userId: string | null;
  name: string;
  role: string;
  focus: string | null;
  active: boolean;
  email: string | null;
  systemRole: SystemRole | null;
  userStatus: "active" | "inactive" | null;
  profileCompleted: boolean | null;
  mustChangePassword: boolean | null;
};

type TeamCrudClientProps = {
  teamMembers: TeamMember[];
  canDelete: boolean;
  canManageUsers: boolean;
  initialError?: string;
};

type FormState = {
  name: string;
  email: string;
  role: string;
  systemRole: SystemRole;
  focus: string;
  password: string;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  role: "",
  systemRole: "team",
  focus: "",
  password: "",
  active: true,
};

const systemRoleLabels: Record<SystemRole, string> = {
  admin: "Administrador",
  team: "Equipa",
  investor: "Investidor",
};

export default function TeamCrudClient({
  teamMembers,
  canDelete,
  canManageUsers,
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
    if (!canManageUsers) return;

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
      email: member.email ?? "",
      role: member.role,
      systemRole: member.systemRole ?? "team",
      focus: member.focus ?? "",
      password: "",
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
    const email = form.email.trim().toLowerCase();
    const role = form.role.trim();
    const focus = form.focus.trim();
    const password = form.password;

    if (!name) {
      setError("O nome é obrigatório.");
      return;
    }

    if (!email) {
      setError("O email é obrigatório.");
      return;
    }

    if (!role) {
      setError("O cargo é obrigatório.");
      return;
    }

    if (!editing && password.length < 8) {
      setError("A password inicial deve ter pelo menos 8 caracteres.");
      return;
    }

    if (name.length > 200) {
      setError("O nome não pode ultrapassar 200 caracteres.");
      return;
    }

    if (email.length > 320) {
      setError("O email não pode ultrapassar 320 caracteres.");
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
            email,
            role,
            systemRole: form.systemRole,
            focus: focus || null,
            ...(editing ? {} : { password }),
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
          : "Membro e conta de acesso criados com sucesso.",
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

          {canManageUsers ? (
            <button type="button" className="btn-primary" onClick={openCreate}>
              + Novo membro
            </button>
          ) : null}
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
              <span>Email de acesso *</span>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="nome@empresa.com"
                maxLength={320}
                disabled={isSubmitting || Boolean(editing)}
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
                placeholder="Ex.: Software Engineer"
                maxLength={150}
                disabled={isSubmitting}
              />
            </label>

            <label>
              <span>Permissão do sistema *</span>
              <select
                className="input"
                value={form.systemRole}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    systemRole: event.target.value as SystemRole,
                  }))
                }
                disabled={isSubmitting || !canManageUsers}
              >
                {Object.entries(systemRoleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
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
                placeholder="Ex.: Desenvolvimento Web"
                maxLength={500}
                disabled={isSubmitting}
              />
            </label>

            {!editing ? (
              <label style={{ gridColumn: "1 / -1" }}>
                <span>Password inicial *</span>
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Mínimo de 8 caracteres"
                  minLength={8}
                  maxLength={200}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </label>
            ) : null}

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
                <div className="team-card-top">
                  <div className="avatar" aria-hidden="true">
                    {member.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>

                  <span
                    className={`team-status ${
                      member.active ? "active" : "inactive"
                    }`}
                  >
                    <span aria-hidden="true">●</span>
                    {member.active ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="team-card-identity">
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </div>

                {member.email ? (
                  <p className="team-card-focus">{member.email}</p>
                ) : null}

                {member.focus ? (
                  <p className="team-card-focus">{member.focus}</p>
                ) : (
                  <p className="team-card-focus team-card-focus-empty">
                    Sem área ou foco definido.
                  </p>
                )}

                <div className="team-card-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => openEdit(member)}
                  >
                    Editar
                  </button>

                  {canDelete ? (
                    <button
                      type="button"
                      className="btn-danger"
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
