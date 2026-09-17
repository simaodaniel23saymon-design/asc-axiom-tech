import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { activities, roadmap, users } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { roadmapCreateSchema, roadmapQuerySchema } from "@/lib/validation/roadmap";

export const runtime = "edge";

const roadmapResponse = {
  id: roadmap.id,
  phase: roadmap.phase,
  title: roadmap.title,
  description: roadmap.description,
  status: roadmap.status,
  priority: roadmap.priority,
  startDate: roadmap.startDate,
  deadline: roadmap.deadline,
  createdAt: roadmap.createdAt,
  updatedAt: roadmap.updatedAt,
};

// Lista fases do roadmap para administradores e membros da equipa.
export async function GET(request: Request) {
  try {
    // Verifica a sessão e o role antes de permitir o acesso aos dados internos.
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
    }
  } catch (error) {
    console.error("[ops/roadmap] Falha ao processar a autorização.", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a autorização." },
      { status: 500 },
    );
  }

  // Valida os parâmetros antes de construir os filtros da consulta.
  const query = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsedQuery = roadmapQuerySchema.safeParse(query);

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

  const { page, limit, status, priority } = parsedQuery.data;
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [];

  if (status) {
    conditions.push(eq(roadmap.status, status));
  }

  if (priority) {
    conditions.push(eq(roadmap.priority, priority));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const db = getDb();

    // A listagem e a contagem usam os mesmos filtros para manter a paginação consistente.
    const [roadmapRows, totalRows] = await Promise.all([
      db
        .select(roadmapResponse)
        .from(roadmap)
        .where(where)
        .orderBy(desc(roadmap.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(roadmap).where(where),
    ]);

    const total = totalRows[0]?.total ?? 0;

    return NextResponse.json({
      data: roadmapRows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[ops/roadmap] Falha ao consultar roadmap.", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar o roadmap." },
      { status: 500 },
    );
  }
}

// Cria uma fase do roadmap e regista a operação no histórico.
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
    const parsedPayload = roadmapCreateSchema.safeParse(payload);

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

    // O neon-http não suporta transacções; uma falha no histórico devolve 500.
    const [createdRoadmap] = await db
      .insert(roadmap)
      .values(parsedPayload.data)
      .returning(roadmapResponse);

    await db.insert(activities).values({
      userId: user.id,
      type: "roadmap_created",
      text: `Roadmap criado: ${createdRoadmap.title}`,
      entityType: "roadmap",
      entityId: createdRoadmap.id,
    });

    return NextResponse.json({ data: createdRoadmap }, { status: 201 });
  } catch (error) {
    console.error("[ops/roadmap] Falha ao criar roadmap.", error);
    return NextResponse.json(
      { error: "Erro interno ao criar o roadmap." },
      { status: 500 },
    );
  }
}