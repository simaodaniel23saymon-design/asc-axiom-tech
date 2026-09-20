import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { activities, teamMembers, users } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { teamMemberCreateSchema } from "@/lib/validation/team";

export const runtime = "edge";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
    }

    const db = getDb();

    const members = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        name: teamMembers.name,
        role: teamMembers.role,
        focus: teamMembers.focus,
        active: teamMembers.active,
        email: users.email,
        systemRole: users.role,
        userStatus: users.status,
        profileCompleted: users.profileCompleted,
        mustChangePassword: users.mustChangePassword,
      })
      .from(teamMembers)
      .leftJoin(users, eq(teamMembers.userId, users.id))
      .orderBy(asc(teamMembers.createdAt), asc(teamMembers.id));

    return NextResponse.json({ data: members });
  } catch (error) {
    console.error("[ops/team] Falha ao consultar a equipa.", error);

    return NextResponse.json(
      { error: "Erro interno ao consultar a equipa." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin"]);

    if (authorizationError) {
      return authorizationError;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 },
      );
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

    const email = parsed.data.email.toLowerCase();
    const db = getDb();

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "Já existe uma conta com este email." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const [createdUser] = await db
      .insert(users)
      .values({
        name: parsed.data.name,
        email,
        passwordHash,
        role: parsed.data.systemRole,
        status: parsed.data.active ? "active" : "inactive",
        mustChangePassword: true,
        profileCompleted: false,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
      });

    try {
      const [member] = await db
        .insert(teamMembers)
        .values({
          userId: createdUser.id,
          name: parsed.data.name,
          role: parsed.data.role,
          focus: parsed.data.focus ?? null,
          active: parsed.data.active,
        })
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
        type: "team_member_created",
        text: `Membro da equipa e conta criados: ${member.name}`,
        entityType: "team_member",
        entityId: member.id,
      });

      return NextResponse.json(
        {
          data: {
            ...member,
            email: createdUser.email,
            systemRole: createdUser.role,
            userStatus: createdUser.status,
          },
        },
        { status: 201 },
      );
    } catch (error) {
      await db.delete(users).where(eq(users.id, createdUser.id));
      throw error;
    }
  } catch (error) {
    console.error("[ops/team] Falha ao criar membro e conta.", error);

    return NextResponse.json(
      { error: "Erro interno ao criar o membro da equipa." },
      { status: 500 },
    );
  }
}
