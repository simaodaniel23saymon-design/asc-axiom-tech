import { NextResponse } from "next/server";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";

import { activities, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const ENTITY_TYPES = new Set([
  "project",
  "goal",
  "roadmap",
  "team_member",
  "investor",
  "milestone",
  "task",
  "engineering",
]);

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
    }

    const url = new URL(request.url);

    const rawPage = Number(url.searchParams.get("page") ?? "1");
    const rawLimit = Number(
      url.searchParams.get("limit") ?? String(DEFAULT_LIMIT),
    );

    const page =
      Number.isInteger(rawPage) && rawPage > 0
        ? rawPage
        : 1;

    const limit =
      Number.isInteger(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;

    const entityType = url.searchParams.get("entityType")?.trim() || null;

    if (entityType && !ENTITY_TYPES.has(entityType)) {
      return NextResponse.json(
        {
          error: "Tipo de entidade inválido.",
        },
        { status: 400 },
      );
    }

    const offset = (page - 1) * limit;
    const db = getDb();

    const entityCondition = entityType
      ? entityType === "engineering"
        ? inArray(activities.entityType, ["milestone", "task"])
        : eq(activities.entityType, entityType)
      : undefined;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: activities.id,
          type: activities.type,
          text: activities.text,
          entityType: activities.entityType,
          entityId: activities.entityId,
          createdAt: activities.createdAt,
          actor: {
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
          },
        })
        .from(activities)
        .leftJoin(users, eq(activities.userId, users.id))
        .where(entityCondition)
        .orderBy(desc(activities.createdAt), asc(activities.id))
        .limit(limit)
        .offset(offset),

      db
        .select({ total: count() })
        .from(activities)
        .where(entityCondition),
    ]);

    const total = Number(totalRows[0]?.total ?? 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(
      "[ops/activities] Falha ao consultar histórico.",
      error,
    );

    return NextResponse.json(
      {
        error: "Erro interno ao consultar o histórico.",
      },
      { status: 500 },
    );
  }
}
