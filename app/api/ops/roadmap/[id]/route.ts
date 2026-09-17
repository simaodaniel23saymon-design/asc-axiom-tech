import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { activities, roadmap } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { roadmapUpdateSchema } from "@/lib/validation/roadmap";

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

// Actualiza uma fase do roadmap e regista a operação no histórico.
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
        { error: "Identificador de roadmap inválido." },
        { status: 400 },
      );
    }

    // Valida o payload parcial e rejeita campos controlados pelo servidor.
    const payload = await request.json().catch(() => null);
    const parsedPayload = roadmapUpdateSchema.safeParse(payload);

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

    // Constrói a actualização apenas com propriedades presentes no payload.
    const updateData: Partial<typeof roadmap.$inferInsert> = { updatedAt: new Date() };
    const input = parsedPayload.data;

    if (input.phase !== undefined) updateData.phase = input.phase;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.startDate !== undefined) updateData.startDate = input.startDate;
    if (input.deadline !== undefined) updateData.deadline = input.deadline;

    const db = getDb();
    const [updatedRoadmap] = await db
      .update(roadmap)
      .set(updateData)
      .where(eq(roadmap.id, idResult.data))
      .returning(roadmapResponse);

    if (!updatedRoadmap) {
      return NextResponse.json({ error: "Roadmap não encontrado." }, { status: 404 });
    }

    // O neon-http não suporta transacções; uma falha no histórico devolve 500.
    await db.insert(activities).values({
      userId: user.id,
      type: "roadmap_updated",
      text: `Roadmap actualizado: ${updatedRoadmap.title}`,
      entityType: "roadmap",
      entityId: updatedRoadmap.id,
    });

    return NextResponse.json({ data: updatedRoadmap });
  } catch (error) {
    console.error("[ops/roadmap/:id] Falha ao actualizar roadmap.", error);
    return NextResponse.json(
      { error: "Erro interno ao actualizar o roadmap." },
      { status: 500 },
    );
  }
}

// Elimina uma fase do roadmap e regista a operação no histórico.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // Apenas administradores podem eliminar fases do roadmap.
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
        { error: "Identificador de roadmap inválido." },
        { status: 400 },
      );
    }

    const db = getDb();
    const [entry] = await db
      .select({ id: roadmap.id, title: roadmap.title })
      .from(roadmap)
      .where(eq(roadmap.id, idResult.data))
      .limit(1);

    if (!entry) {
      return NextResponse.json({ error: "Roadmap não encontrado." }, { status: 404 });
    }

    const [deletedRoadmap] = await db
      .delete(roadmap)
      .where(eq(roadmap.id, idResult.data))
      .returning({ id: roadmap.id, title: roadmap.title });

    if (!deletedRoadmap) {
      return NextResponse.json({ error: "Roadmap não encontrado." }, { status: 404 });
    }

    // O neon-http não suporta transacções; uma falha no histórico após o DELETE devolve 500.
    await db.insert(activities).values({
      userId: user.id,
      type: "roadmap_deleted",
      text: `Roadmap eliminado: ${entry.title}`,
      entityType: "roadmap",
      entityId: entry.id,
    });

    return NextResponse.json({
      ok: true,
      data: { id: entry.id, title: entry.title },
    });
  } catch (error) {
    console.error("[ops/roadmap/:id] Falha ao eliminar roadmap.", error);
    return NextResponse.json(
      { error: "Erro interno ao eliminar o roadmap." },
      { status: 500 },
    );
  }
}