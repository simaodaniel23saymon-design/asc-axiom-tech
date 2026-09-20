import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { activities, projects, users } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { projectUpdateSchema } from "@/lib/validation/projects";

export const runtime = "edge";

const projectResponse = {
  id: projects.id,
  name: projects.name,
  description: projects.description,
  status: projects.status,
  priority: projects.priority,
  progress: projects.progress,
  ownerLabel: projects.ownerLabel,
  ownerId: projects.ownerId,
  startDate: projects.startDate,
  deadline: projects.deadline,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
};

// Actualiza um projecto operacional e regista a operação no histórico.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verifica a sessão e o role antes de permitir alterações operacionais.
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    // O role investor não pode alterar projectos operacionais.
    if (authorizationError) {
      return authorizationError;
    }

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // Valida o identificador antes de o usar na consulta à base de dados.
    const idResult = z.uuid().safeParse(id);

    if (!idResult.success) {
      return NextResponse.json(
        { error: "Identificador de projecto inválido." },
        { status: 400 },
      );
    }

    // Valida e restringe o payload aos campos editáveis do projecto.
    const payload = await request.json().catch(() => null);
    const parsedPayload = projectUpdateSchema.safeParse(payload);

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

    // Só consulta users quando ownerId foi enviado como UUID; null remove o responsável.
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

    // Constrói o update apenas com propriedades presentes; campos omitidos ficam inalterados.
    const updateData: Partial<typeof projects.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.progress !== undefined) updateData.progress = input.progress;
    if (input.ownerLabel !== undefined) updateData.ownerLabel = input.ownerLabel;
    if (input.ownerId !== undefined) updateData.ownerId = input.ownerId;
    if (input.startDate !== undefined) updateData.startDate = input.startDate;
    if (input.deadline !== undefined) updateData.deadline = input.deadline;

    const [updatedProject] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, idResult.data))
      .returning(projectResponse);

    if (!updatedProject) {
      return NextResponse.json(
        { error: "Projecto não encontrado." },
        { status: 404 },
      );
    }

    // O neon-http não suporta transacções; se o histórico falhar, devolve 500
    // para não comunicar um sucesso completo que não aconteceu.
    await db.insert(activities).values({
      userId: user.id,
      type: "project_updated",
      text: `Projecto actualizado: ${updatedProject.name}`,
      entityType: "project",
      entityId: updatedProject.id,
    });

    return NextResponse.json({ data: updatedProject });
  } catch (error) {
    console.error("[ops/projects/:id] Falha ao actualizar projecto.", error);

    // Não expõe stack traces, credenciais ou detalhes internos ao cliente.
    return NextResponse.json(
      { error: "Erro interno ao actualizar o projecto." },
      { status: 500 },
    );
  }
}

// Elimina um projecto operacional e regista a operação no histórico.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Apenas administradores podem eliminar projectos operacionais.
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin"]);

    if (authorizationError) {
      return authorizationError;
    }

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // Valida o identificador antes de o usar nas consultas à base de dados.
    const idResult = z.uuid().safeParse(id);

    if (!idResult.success) {
      return NextResponse.json(
        { error: "Identificador de projecto inválido." },
        { status: 400 },
      );
    }

    const db = getDb();
    const [project] = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.id, idResult.data))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: "Projecto não encontrado." },
        { status: 404 },
      );
    }

    // A BD aplica as relações existentes: milestones em cascade e tasks com projectId nulo.
    const [deletedProject] = await db
      .delete(projects)
      .where(eq(projects.id, idResult.data))
      .returning({ id: projects.id, name: projects.name });

    if (!deletedProject) {
      return NextResponse.json(
        { error: "Projecto não encontrado." },
        { status: 404 },
      );
    }

    // O neon-http não suporta transacções; se o histórico falhar após o DELETE,
    // devolve 500 sem comunicar um sucesso completo que não aconteceu.
    await db.insert(activities).values({
      userId: user.id,
      type: "project_deleted",
      text: `Projecto eliminado: ${project.name}`,
      entityType: "project",
      entityId: project.id,
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: project.id,
        name: project.name,
      },
    });
  } catch (error) {
    console.error("[ops/projects/:id] Falha ao eliminar projecto.", error);

    // Não expõe stack traces, credenciais ou detalhes internos ao cliente.
    return NextResponse.json(
      { error: "Erro interno ao eliminar o projecto." },
      { status: 500 },
    );
  }
}