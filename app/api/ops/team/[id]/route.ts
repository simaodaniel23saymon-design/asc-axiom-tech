import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { activities, teamMembers, users } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { teamMemberUpdateSchema } from "@/lib/validation/team";

export const runtime = "edge";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
    }

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = teamMemberUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const db = getDb();

    const [existing] = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        name: teamMembers.name,
      })
      .from(teamMembers)
      .where(eq(teamMembers.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Membro da equipa não encontrado." },
        { status: 404 },
      );
    }

    if (
      user.role !== "admin" &&
      (parsed.data.email !== undefined || parsed.data.systemRole !== undefined)
    ) {
      return NextResponse.json(
        { error: "Apenas administradores podem alterar email ou função do sistema." },
        { status: 403 },
      );
    }

    const { email, systemRole, ...memberData } = parsed.data;

    if (email !== undefined && existing.userId) {
      const normalizedEmail = email.toLowerCase();

      const [emailOwner] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (emailOwner && emailOwner.id !== existing.userId) {
        return NextResponse.json(
          { error: "Já existe uma conta com este email." },
          { status: 409 },
        );
      }

      await db
        .update(users)
        .set({
          email: normalizedEmail,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.userId));
    }

    if (systemRole !== undefined && existing.userId) {
      await db
        .update(users)
        .set({
          role: systemRole,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.userId));
    }

    if (existing.userId) {
      const userUpdate: {
        name?: string;
        status?: "active" | "inactive";
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (memberData.name !== undefined) {
        userUpdate.name = memberData.name;
      }

      if (memberData.active !== undefined) {
        userUpdate.status = memberData.active ? "active" : "inactive";
      }

      if (Object.keys(userUpdate).length > 1) {
        await db
          .update(users)
          .set(userUpdate)
          .where(eq(users.id, existing.userId));
      }
    }

    const [member] = await db
      .update(teamMembers)
      .set({
        ...memberData,
        updatedAt: new Date(),
      })
      .where(eq(teamMembers.id, id))
      .returning({
        id: teamMembers.id,
        userId: teamMembers.userId,
        name: teamMembers.name,
        role: teamMembers.role,
        focus: teamMembers.focus,
        active: teamMembers.active,
      });

    await db.insert(activities).values({
      userId: user.id,
      type: "team_member_updated",
      text: `Membro da equipa actualizado: ${member.name}`,
      entityType: "team_member",
      entityId: member.id,
    });

    const [updatedUser] = existing.userId
      ? await db
          .select({
            email: users.email,
            systemRole: users.role,
            userStatus: users.status,
            profileCompleted: users.profileCompleted,
            mustChangePassword: users.mustChangePassword,
          })
          .from(users)
          .where(eq(users.id, existing.userId))
          .limit(1)
      : [null];

    return NextResponse.json({
      data: {
        ...member,
        email: updatedUser?.email ?? null,
        systemRole: updatedUser?.systemRole ?? null,
        userStatus: updatedUser?.userStatus ?? null,
        profileCompleted: updatedUser?.profileCompleted ?? null,
        mustChangePassword: updatedUser?.mustChangePassword ?? null,
      },
    });
  } catch (error) {
    console.error("[ops/team] Falha ao actualizar membro da equipa.", error);

    return NextResponse.json(
      { error: "Erro interno ao actualizar o membro da equipa." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin"]);

    if (authorizationError) {
      return authorizationError;
    }

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const db = getDb();

    const [existing] = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        name: teamMembers.name,
      })
      .from(teamMembers)
      .where(eq(teamMembers.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Membro da equipa não encontrado." },
        { status: 404 },
      );
    }

    if (existing.userId === user.id) {
      return NextResponse.json(
        { error: "Não pode eliminar a sua própria conta através da gestão da equipa." },
        { status: 400 },
      );
    }

    await db
      .delete(teamMembers)
      .where(eq(teamMembers.id, id));

    if (existing.userId) {
      await db
        .delete(users)
        .where(eq(users.id, existing.userId));
    }

    await db.insert(activities).values({
      userId: user.id,
      type: "team_member_deleted",
      text: `Membro da equipa eliminado: ${existing.name}`,
      entityType: "team_member",
      entityId: existing.id,
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: existing.id,
        name: existing.name,
      },
    });
  } catch (error) {
    console.error("[ops/team] Falha ao eliminar membro da equipa.", error);

    return NextResponse.json(
      { error: "Erro interno ao eliminar o membro da equipa." },
      { status: 500 },
    );
  }
}
