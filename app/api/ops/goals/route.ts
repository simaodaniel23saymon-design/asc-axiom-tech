import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { activities, goals, users } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { goalCreateSchema, goalsQuerySchema } from "@/lib/validation/goals";

export const runtime = "edge";

const goalResponse = {
  id: goals.id,
  title: goals.title,
  description: goals.description,
  progress: goals.progress,
  target: goals.target,
  status: goals.status,
  ownerId: goals.ownerId,
  deadline: goals.deadline,
  createdAt: goals.createdAt,
  updatedAt: goals.updatedAt,
};

// Lista objectivos estratégicos para administradores e membros da equipa.
export async function GET(request: Request) {
  try {
    // Verifica a sessão e o role antes de permitir o acesso aos dados internos.
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
    }
  } catch (error) {
    console.error("[ops/goals] Falha ao processar a autorização.", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a autorização." },
      { status: 500 },
    );
  }

  // Valida os parâmetros antes de construir os filtros da consulta.
  const query = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsedQuery = goalsQuerySchema.safeParse(query);

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Parâmetros inválidos.",
        details: parsedQuery.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const { page, limit, status } = parsedQuery.data;
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [];

  if (status) {
    conditions.push(eq(goals.status, status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const db = getDb();

    // A listagem e a contagem usam os mesmos filtros para manter a paginação consistente.
    const [goalRows, totalRows] = await Promise.all([
      db
        .select(goalResponse)
        .from(goals)
        .where(where)
        .orderBy(desc(goals.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(goals).where(where),
    ]);

    const total = totalRows[0]?.total ?? 0;

    return NextResponse.json({
      data: goalRows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[ops/goals] Falha ao consultar objectivos.", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar os objectivos." },
      { status: 500 },
    );
  }
}

// Cria um objectivo e regista a operação no histórico.
export async function POST(request: Request) {
  try {
    // Verifica a sessão e o role antes de permitir a criação de dados internos.
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
    }

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // Valida e restringe o payload aos campos permitidos para criação.
    const payload = await request.json().catch(() => null);
    const parsedPayload = goalCreateSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
          details: parsedPayload.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const db = getDb();
    const { ownerId, ...goalData } = parsedPayload.data;

    // Confirma que ownerId aponta para um utilizador existente antes de inserir.
    if (ownerId) {
      const owner = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, ownerId))
        .limit(1);

      if (owner.length === 0) {
        return NextResponse.json(
          { error: "Dados inválidos.", details: [{ path: ["ownerId"], message: "Utilizador inexistente." }] },
          { status: 400 },
        );
      }
    }

    // O neon-http não suporta transacções; uma falha no histórico devolve 500.
    const [createdGoal] = await db
      .insert(goals)
      .values({ ...goalData, ownerId })
      .returning(goalResponse);

    await db.insert(activities).values({
      userId: user.id,
      type: "goal_created",
      text: `Objectivo criado: ${createdGoal.title}`,
      entityType: "goal",
      entityId: createdGoal.id,
    });

    return NextResponse.json({ data: createdGoal }, { status: 201 });
  } catch (error) {
    console.error("[ops/goals] Falha ao criar objectivo.", error);
    return NextResponse.json(
      { error: "Erro interno ao criar o objectivo." },
      { status: 500 },
    );
  }
}