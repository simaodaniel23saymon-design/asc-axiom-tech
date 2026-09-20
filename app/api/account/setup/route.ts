import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { teamMembers, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const focus =
      typeof body.focus === "string" ? body.focus.trim() : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    if (!name || name.length > 200) {
      return NextResponse.json(
        { error: "O nome é obrigatório." },
        { status: 400 },
      );
    }

    if (password.length < 8 || password.length > 200) {
      return NextResponse.json(
        { error: "A palavra-passe deve ter entre 8 e 200 caracteres." },
        { status: 400 },
      );
    }

    const db = getDb();
    const passwordHash = await hashPassword(password);

    await db
      .update(users)
      .set({
        name,
        passwordHash,
        mustChangePassword: false,
        profileCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await db
      .update(teamMembers)
      .set({
        name,
        focus: focus || null,
        updatedAt: new Date(),
      })
      .where(eq(teamMembers.userId, user.id));

    const { activities } = await import("@/db/schema");

    await db.insert(activities).values({
      userId: user.id,
      type: "profile_completed",
      text: "Configuração inicial da conta concluída.",
      entityType: "user",
      entityId: user.id,
    });

    return NextResponse.json({
      ok: true,
      message: "Configuração concluída com sucesso.",
    });
  } catch (error) {
    console.error("[account/setup] Falha ao concluir configuração.", error);

    return NextResponse.json(
      { error: "Não foi possível concluir a configuração." },
      { status: 500 },
    );
  }
}
