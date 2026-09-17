import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { teamMembers } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { teamMemberCreateSchema } from "@/lib/validation/team";

export const runtime = "edge";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
    }
  } catch (error) {
    console.error("[ops/team] Falha ao processar a autorização.", error);

    return NextResponse.json(
      { error: "Erro interno ao processar a autorização." },
      { status: 500 },
    );
  }

  try {
    const db = getDb();

    const members = await db
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
        role: teamMembers.role,
        focus: teamMembers.focus,
        active: teamMembers.active,
      })
      .from(teamMembers)
      .orderBy(asc(teamMembers.createdAt), asc(teamMembers.id));

    return NextResponse.json({ data: members });
  } catch (error) {
    console.error("[ops/team] Falha ao consultar membros da equipa.", error);

    return NextResponse.json(
      { error: "Erro interno ao consultar a equipa." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
    }

    const body = await request.json();
    const parsed = teamMemberCreateSchema.safeParse(body);

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

    const [member] = await db
      .insert(teamMembers)
      .values({
        name: parsed.data.name,
        role: parsed.data.role,
        focus: parsed.data.focus ?? null,
        active: parsed.data.active,
      })
      .returning({
        id: teamMembers.id,
        name: teamMembers.name,
        role: teamMembers.role,
        focus: teamMembers.focus,
        active: teamMembers.active,
      });

    await db.insert((await import("@/db/schema")).activities).values({
      userId: user?.id ?? null,
      type: "team_member_created",
      text: `Membro da equipa criado: ${member.name}`,
      entityType: "team_member",
      entityId: member.id,
    });

    return NextResponse.json({ data: member }, { status: 201 });
  } catch (error) {
    console.error("[ops/team] Falha ao criar membro da equipa.", error);

    return NextResponse.json(
      { error: "Erro interno ao criar o membro da equipa." },
      { status: 500 },
    );
  }
}
