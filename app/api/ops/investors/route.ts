import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { activities, investors } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { investorCreateSchema } from "@/lib/validation/investors";

export const runtime = "edge";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "investor"]);

    if (authorizationError) {
      return authorizationError;
    }
  } catch (error) {
    console.error("[ops/investors] Falha ao processar a autorização.", error);

    return NextResponse.json(
      { error: "Erro interno ao processar a autorização." },
      { status: 500 },
    );
  }

  try {
    const db = getDb();

    const investorRows = await db
      .select({
        id: investors.id,
        name: investors.name,
        organization: investors.organization,
        email: investors.email,
        phone: investors.phone,
        status: investors.status,
        notes: investors.notes,
        lastContactAt: investors.lastContactAt,
        nextFollowUpAt: investors.nextFollowUpAt,
      })
      .from(investors)
      .orderBy(asc(investors.createdAt), asc(investors.id));

    return NextResponse.json({ data: investorRows });
  } catch (error) {
    console.error("[ops/investors] Falha ao consultar investidores.", error);

    return NextResponse.json(
      { error: "Erro interno ao consultar investidores." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "investor"]);

    if (authorizationError) {
      return authorizationError;
    }

    const body = await request.json();
    const parsed = investorCreateSchema.safeParse(body);

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

    const [investor] = await db
      .insert(investors)
      .values({
        name: parsed.data.name,
        organization: parsed.data.organization ?? null,
        email: parsed.data.email ?? null,
        phone: parsed.data.phone ?? null,
        status: parsed.data.status,
        notes: parsed.data.notes ?? null,
        lastContactAt: parsed.data.lastContactAt
          ? new Date(parsed.data.lastContactAt)
          : null,
        nextFollowUpAt: parsed.data.nextFollowUpAt
          ? new Date(parsed.data.nextFollowUpAt)
          : null,
      })
      .returning({
        id: investors.id,
        name: investors.name,
        organization: investors.organization,
        email: investors.email,
        phone: investors.phone,
        status: investors.status,
        notes: investors.notes,
        lastContactAt: investors.lastContactAt,
        nextFollowUpAt: investors.nextFollowUpAt,
      });

    await db.insert(activities).values({
      userId: user?.id ?? null,
      type: "investor_created",
      text: `Investidor criado: ${investor.name}`,
      entityType: "investor",
      entityId: investor.id,
    });

    return NextResponse.json({ data: investor }, { status: 201 });
  } catch (error) {
    console.error("[ops/investors] Falha ao criar investidor.", error);

    return NextResponse.json(
      { error: "Erro interno ao criar o investidor." },
      { status: 500 },
    );
  }
}
