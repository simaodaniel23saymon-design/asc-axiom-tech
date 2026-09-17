import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { activities, teamMembers } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { teamMemberUpdateSchema } from "@/lib/validation/team";

export const runtime = "edge";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
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
        name: teamMembers.name,
      })
      .from(teamMembers)
      .where(eq(teamMembers.id, context.params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Membro da equipa não encontrado." },
        { status: 404 },
      );
    }

    const [member] = await db
      .update(teamMembers)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(teamMembers.id, context.params.id))
      .returning({
        id: teamMembers.id,
        name: teamMembers.name,
        role: teamMembers.role,
        focus: teamMembers.focus,
        active: teamMembers.active,
      });

    await db.insert(activities).values({
      userId: user?.id ?? null,
      type: "team_member_updated",
      text: `Membro da equipa actualizado: ${member.name}`,
      entityType: "team_member",
      entityId: member.id,
    });

    return NextResponse.json({ data: member });
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
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin"]);

    if (authorizationError) {
      return authorizationError;
    }

    const db = getDb();

    const [existing] = await db
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
      })
      .from(teamMembers)
      .where(eq(teamMembers.id, context.params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Membro da equipa não encontrado." },
        { status: 404 },
      );
    }

    await db
      .delete(teamMembers)
      .where(eq(teamMembers.id, context.params.id));

    await db.insert(activities).values({
      userId: user?.id ?? null,
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
