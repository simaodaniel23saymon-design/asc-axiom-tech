"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type SetupFormProps = {
  email: string;
  initialName: string;
  role: string;
  initialFocus: string;
};

export default function SetupForm({
  email,
  initialName,
  role,
  initialFocus,
}: SetupFormProps) {
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

    if (password.length < 8) {
      setError("A nova password deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As passwords não coincidem.");
      return;
    }

    if (!name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/account/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          focus: focus.trim(),
          password,
        }),
      });

      const payload = await response
        .json()
        .catch(() => ({ error: "Não foi possível concluir a configuração." }));

      if (!response.ok) {
        setError(payload.error ?? "Não foi possível concluir a configuração.");
        setIsSubmitting(false);
        return;
      }

      setSuccess("Perfil configurado. A entrar no Command Center...");

      router.push(payload.redirectTo ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Erro de ligação. Tente novamente.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <label>
        <span>Email</span>
        <input type="email" value={email} readOnly />
      </label>

      <label>
        <span>Cargo</span>
        <input type="text" value={role} readOnly />
      </label>

      <label>
        <span>Nome completo</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="O seu nome completo"
          autoComplete="name"
          required
        />
      </label>

      <label>
        <span>Área / foco</span>
        <input
          type="text"
          value={focus}
          onChange={(event) => setFocus(event.target.value)}
          placeholder="Ex.: Desenvolvimento Web"
        />
      </label>

      <label>
        <span>Nova password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo de 8 caracteres"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      <label>
        <span>Confirmar password</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repita a nova password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      {error ? <p className="auth-error">{error}</p> : null}
      {success ? <p className="auth-success">{success}</p> : null}

      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "A guardar..." : "Concluir configuração"}
      </button>
    </form>
  );
}
