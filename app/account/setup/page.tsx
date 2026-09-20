import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { teamMembers } from "@/db/schema";
import SetupForm from "./SetupForm";

export const runtime = "edge";

export default async function AccountSetupPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.mustChangePassword && user.profileCompleted) {
    redirect("/dashboard");
  }

  const db = getDb();

  const members = await db
    .select({
      name: teamMembers.name,
      role: teamMembers.role,
      focus: teamMembers.focus,
    })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  const member = members[0];

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">ASC Axiom Tech</span>
          <h1>Configurar acesso</h1>
          <p>
            Complete o seu perfil e defina a sua password pessoal antes de
            entrar no Command Center.
          </p>
        </div>

        <SetupForm
          email={user.email}
          initialName={member?.name ?? user.name}
          role={member?.role ?? "A definir pelo administrador"}
          initialFocus={member?.focus ?? ""}
        />
      </section>
    </main>
  );
}
