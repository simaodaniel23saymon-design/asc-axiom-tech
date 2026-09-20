import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { activities, investors } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { investorUpdateSchema } from "@/lib/validation/investors";

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
    const authorizationError = authorizeApi(user, ["admin", "investor"]);

    if (authorizationError) {
      return authorizationError;
    }

    const body = await request.json();
    const parsed = investorUpdateSchema.safeParse(body);

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

    const [existingInvestor] = await db
      .select({
        id: investors.id,
        name: investors.name,
      })
      .from(investors)
      .where(eq(investors.id, id))
      .limit(1);

    if (!existingInvestor) {
      return NextResponse.json(
        { error: "Investidor não encontrado." },
        { status: 404 },
      );
    }

    const updateData = {
      ...(parsed.data.name !== undefined
        ? { name: parsed.data.name }
        : {}),
      ...(parsed.data.organization !== undefined
        ? { organization: parsed.data.organization ?? null }
        : {}),
      ...(parsed.data.email !== undefined
        ? { email: parsed.data.email ?? null }
        : {}),
      ...(parsed.data.phone !== undefined
        ? { phone: parsed.data.phone ?? null }
        : {}),
      ...(parsed.data.status !== undefined
        ? { status: parsed.data.status }
        : {}),
      ...(parsed.data.notes !== undefined
        ? { notes: parsed.data.notes ?? null }
        : {}),
      ...(parsed.data.lastContactAt !== undefined
        ? {
            lastContactAt: parsed.data.lastContactAt
              ? new Date(parsed.data.lastContactAt)
              : null,
          }
        : {}),
      ...(parsed.data.nextFollowUpAt !== undefined
        ? {
            nextFollowUpAt: parsed.data.nextFollowUpAt
              ? new Date(parsed.data.nextFollowUpAt)
              : null,
          }
        : {}),
      updatedAt: new Date(),
    };

    const [investor] = await db
      .update(investors)
      .set(updateData)
      .where(eq(investors.id, id))
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
      type: "investor_updated",
      text: `Investidor actualizado: ${investor.name}`,
      entityType: "investor",
      entityId: investor.id,
    });

    return NextResponse.json({ data: investor });
  } catch (error) {
    console.error("[ops/investors/:id] Falha ao actualizar investidor.", error);

    return NextResponse.json(
      { error: "Erro interno ao actualizar o investidor." },
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

    const db = getDb();

    const [existingInvestor] = await db
      .select({
        id: investors.id,
        name: investors.name,
      })
      .from(investors)
      .where(eq(investors.id, id))
      .limit(1);

    if (!existingInvestor) {
      return NextResponse.json(
        { error: "Investidor não encontrado." },
        { status: 404 },
      );
    }

    await db
      .delete(investors)
      .where(eq(investors.id, id));

    await db.insert(activities).values({
      userId: user?.id ?? null,
      type: "investor_deleted",
      text: `Investidor eliminado: ${existingInvestor.name}`,
      entityType: "investor",
      entityId: existingInvestor.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ops/investors/:id] Falha ao eliminar investidor.", error);

    return NextResponse.json(
      { error: "Erro interno ao eliminar o investidor." },
      { status: 500 },
    );
  }
}
