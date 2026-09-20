import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { activities, teamMembers, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

export const runtime = "edge";

export async function PUT(request: Request) {
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

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    if (!name || name.length > 200) {
      return NextResponse.json(
        { error: "O nome é obrigatório." },
        { status: 400 },
      );
    }

    if (focus.length > 500) {
      return NextResponse.json(
        { error: "A área / foco é demasiado longa." },
        { status: 400 },
      );
    }

    if (password || confirmPassword) {
      if (password.length < 8 || password.length > 200) {
        return NextResponse.json(
          { error: "A palavra-passe deve ter entre 8 e 200 caracteres." },
          { status: 400 },
        );
      }

      if (password !== confirmPassword) {
        return NextResponse.json(
          { error: "As palavras-passe não coincidem." },
          { status: 400 },
        );
      }
    }

    const db = getDb();

    const userUpdate: {
      name: string;
      passwordHash?: string;
      updatedAt: Date;
    } = {
      name,
      updatedAt: new Date(),
    };

    if (password) {
      userUpdate.passwordHash = await hashPassword(password);
    }

    await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, user.id));

    await db
      .update(teamMembers)
      .set({
        name,
        focus: focus || null,
        updatedAt: new Date(),
      })
      .where(eq(teamMembers.userId, user.id));

    await db.insert(activities).values({
      userId: user.id,
      type: "profile_updated",
      text: password
        ? "Perfil e palavra-passe actualizados."
        : "Perfil actualizado.",
      entityType: "user",
      entityId: user.id,
    });

    return NextResponse.json({
      ok: true,
      data: {
        name,
        focus: focus || null,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[account/profile] Falha ao actualizar perfil.", error);

    return NextResponse.json(
      { error: "Não foi possível actualizar o perfil." },
      { status: 500 },
    );
  }
}
