"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ProfileFormProps = {
  email: string;
  role: "admin" | "team" | "investor";
  initialName: string;
  initialFocus: string;
};

const roleLabels = {
  admin: "Administrador",
  team: "Equipa",
  investor: "Investidor",
} as const;

export default function ProfileForm({
  email,
  role,
  initialName,
  initialFocus,
}: ProfileFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [focus, setFocus] = useState(initialFocus);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }

    if (name.trim().length > 200) {
      setError("O nome não pode ultrapassar 200 caracteres.");
      return;
    }

    if (focus.trim().length > 500) {
      setError("A área / foco não pode ultrapassar 500 caracteres.");
      return;
    }

    if (password || confirmPassword) {
      if (password.length < 8) {
        setError("A nova palavra-passe deve ter pelo menos 8 caracteres.");
        return;
      }

      if (password !== confirmPassword) {
        setError("As palavras-passe não coincidem.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          focus: focus.trim(),
          password,
          confirmPassword,
        }),
      });

      const payload = await response
        .json()
        .catch(() => ({
          error: "Não foi possível actualizar o perfil.",
        }));

      if (!response.ok) {
        setError(payload.error ?? "Não foi possível actualizar o perfil.");
        setIsSubmitting(false);
        return;
      }

      setSuccess("Perfil actualizado com sucesso.");
      setPassword("");
      setConfirmPassword("");

      router.refresh();
    } catch {
      setError("Erro de ligação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="ops-card">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="ops-section-header">
          <div>
            <span className="eyebrow">DADOS DA CONTA</span>
            <h3>Informações pessoais</h3>
          </div>
        </div>

        <div className="ops-form-grid">
          <label>
            <span>Nome completo</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={200}
              autoComplete="name"
              required
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              readOnly
              disabled
            />
            <small>
              O email é gerido pelo administrador.
            </small>
          </label>

          <label>
            <span>Função no sistema</span>
            <input
              type="text"
              value={roleLabels[role]}
              readOnly
              disabled
            />
            <small>
              A função do sistema não pode ser alterada pelo próprio utilizador.
            </small>
          </label>

          <label>
            <span>Área / foco</span>
            <input
              type="text"
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              maxLength={500}
              placeholder="Ex.: Desenvolvimento, Marketing, Operações..."
              autoComplete="organization-title"
            />
          </label>
        </div>

        <div className="ops-section-header">
          <div>
            <span className="eyebrow">SEGURANÇA</span>
            <h3>Alterar palavra-passe</h3>
            <p>
              Deixe os campos vazios se não quiser alterar a palavra-passe.
            </p>
          </div>
        </div>

        <div className="ops-form-grid">
          <label>
            <span>Nova palavra-passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={200}
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
            />
          </label>

          <label>
            <span>Confirmar palavra-passe</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              maxLength={200}
              autoComplete="new-password"
              placeholder="Repita a nova palavra-passe"
            />
          </label>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success" role="status">
            {success}
          </div>
        )}

        <div className="ops-form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "A guardar..." : "Guardar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
