import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { teamMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import ProfileForm from "./ProfileForm";

export const runtime = "edge";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const db = getDb();

  const [member] = await db
    .select({
      focus: teamMembers.focus,
    })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  return (
    <section className="ops-page">
      <div className="ops-page-header">
        <div>
          <span className="eyebrow">CONTA</span>
          <h2>Meu perfil</h2>
          <p>
            Actualize os seus dados pessoais e mantenha a sua conta segura.
          </p>
        </div>
      </div>

      <ProfileForm
        email={user.email}
        role={user.role}
        initialName={user.name}
        initialFocus={member?.focus ?? ""}
      />
    </section>
  );
}
