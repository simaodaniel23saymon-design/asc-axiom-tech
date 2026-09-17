import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { activities, goals, users } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { goalUpdateSchema } from "@/lib/validation/goals";

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

// Actualiza um objectivo e regista a operação no histórico.
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // Verifica a sessão e o role antes de permitir alterações internas.
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
    }

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // Valida o identificador antes de o usar na consulta.
    const idResult = z.uuid().safeParse(params.id);

    if (!idResult.success) {
      return NextResponse.json(
        { error: "Identificador de objectivo inválido." },
        { status: 400 },
      );
    }

    // Valida o payload parcial e rejeita campos controlados pelo servidor.
    const payload = await request.json().catch(() => null);
    const parsedPayload = goalUpdateSchema.safeParse(payload);

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
    const input = parsedPayload.data;

    // Só valida ownerId contra users quando é enviado como UUID; null remove o responsável.
    if (input.ownerId) {
      const owner = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, input.ownerId))
        .limit(1);

      if (owner.length === 0) {
        return NextResponse.json(
          { error: "Dados inválidos.", details: [{ path: ["ownerId"], message: "Utilizador inexistente." }] },
          { status: 400 },
        );
      }
    }

    // Constrói a actualização apenas com propriedades presentes no payload.
    const updateData: Partial<typeof goals.$inferInsert> = { updatedAt: new Date() };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.progress !== undefined) updateData.progress = input.progress;
    if (input.target !== undefined) updateData.target = input.target;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.ownerId !== undefined) updateData.ownerId = input.ownerId;
    if (input.deadline !== undefined) updateData.deadline = input.deadline;

    const [updatedGoal] = await db
      .update(goals)
      .set(updateData)
      .where(eq(goals.id, idResult.data))
      .returning(goalResponse);

    if (!updatedGoal) {
      return NextResponse.json({ error: "Objectivo não encontrado." }, { status: 404 });
    }

    // O neon-http não suporta transacções; uma falha no histórico devolve 500.
    await db.insert(activities).values({
      userId: user.id,
      type: "goal_updated",
      text: `Objectivo actualizado: ${updatedGoal.title}`,
      entityType: "goal",
      entityId: updatedGoal.id,
    });

    return NextResponse.json({ data: updatedGoal });
  } catch (error) {
    console.error("[ops/goals/:id] Falha ao actualizar objectivo.", error);
    return NextResponse.json(
      { error: "Erro interno ao actualizar o objectivo." },
      { status: 500 },
    );
  }
}

// Elimina um objectivo e regista a operação no histórico.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // Apenas administradores podem eliminar objectivos.
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin"]);

    if (authorizationError) {
      return authorizationError;
    }

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // Valida o identificador antes de o usar na consulta.
    const idResult = z.uuid().safeParse(params.id);

    if (!idResult.success) {
      return NextResponse.json(
        { error: "Identificador de objectivo inválido." },
        { status: 400 },
      );
    }

    const db = getDb();
    const [goal] = await db
      .select({ id: goals.id, title: goals.title })
      .from(goals)
      .where(eq(goals.id, idResult.data))
      .limit(1);

    if (!goal) {
      return NextResponse.json({ error: "Objectivo não encontrado." }, { status: 404 });
    }

    const [deletedGoal] = await db
      .delete(goals)
      .where(eq(goals.id, idResult.data))
      .returning({ id: goals.id, title: goals.title });

    if (!deletedGoal) {
      return NextResponse.json({ error: "Objectivo não encontrado." }, { status: 404 });
    }

    // O neon-http não suporta transacções; uma falha no histórico após o DELETE devolve 500.
    await db.insert(activities).values({
      userId: user.id,
      type: "goal_deleted",
      text: `Objectivo eliminado: ${goal.title}`,
      entityType: "goal",
      entityId: goal.id,
    });

    return NextResponse.json({
      ok: true,
      data: { id: goal.id, title: goal.title },
    });
  } catch (error) {
    console.error("[ops/goals/:id] Falha ao eliminar objectivo.", error);
    return NextResponse.json(
      { error: "Erro interno ao eliminar o objectivo." },
      { status: 500 },
    );
  }
}