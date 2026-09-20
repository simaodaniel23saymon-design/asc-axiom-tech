import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  activities,
  milestones,
  projects,
  tasks,
  users,
} from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { engineeringTaskUpdateSchema } from "@/lib/validation/engineering";

export const runtime = "edge";

const idSchema = z.uuid();

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const authError = authorizeApi(user, ["admin", "team"]);

  if (authError) {
    return authError;
  }

  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado." },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  const parsedId = idSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json(
      { error: "ID da tarefa inválido." },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido." },
      { status: 400 },
    );
  }

  const parsed = engineeringTaskUpdateSchema.safeParse(body);

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

  const [existingTask] = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      projectId: tasks.projectId,
      milestoneId: tasks.milestoneId,
    })
    .from(tasks)
    .where(eq(tasks.id, parsedId.data))
    .limit(1);

  if (!existingTask) {
    return NextResponse.json(
      { error: "Tarefa não encontrada." },
      { status: 404 },
    );
  }

  const finalProjectId =
    parsed.data.projectId !== undefined
      ? parsed.data.projectId
      : existingTask.projectId;

  const finalMilestoneId =
    parsed.data.milestoneId !== undefined
      ? parsed.data.milestoneId
      : existingTask.milestoneId;

  if (parsed.data.projectId) {
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, parsed.data.projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: "Projecto associado não encontrado." },
        { status: 400 },
      );
    }
  }

  if (parsed.data.milestoneId) {
    const [milestone] = await db
      .select({
        id: milestones.id,
        projectId: milestones.projectId,
      })
      .from(milestones)
      .where(eq(milestones.id, parsed.data.milestoneId))
      .limit(1);

    if (!milestone) {
      return NextResponse.json(
        { error: "Marco associado não encontrado." },
        { status: 400 },
      );
    }

    if (
      finalProjectId &&
      milestone.projectId &&
      milestone.projectId !== finalProjectId
    ) {
      return NextResponse.json(
        {
          error: "O marco seleccionado não pertence ao projecto indicado.",
        },
        { status: 400 },
      );
    }
  }

  if (parsed.data.ownerId) {
    const [owner] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, parsed.data.ownerId))
      .limit(1);

    if (!owner) {
      return NextResponse.json(
        { error: "Responsável não encontrado." },
        { status: 400 },
      );
    }
  }

  const updateData: Partial<typeof tasks.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.data.projectId !== undefined) {
    updateData.projectId = parsed.data.projectId;
  }

  if (parsed.data.milestoneId !== undefined) {
    updateData.milestoneId = parsed.data.milestoneId;
  }

  if (parsed.data.title !== undefined) {
    updateData.title = parsed.data.title;
  }

  if (parsed.data.description !== undefined) {
    updateData.description = parsed.data.description;
  }

  if (parsed.data.ownerLabel !== undefined) {
    updateData.ownerLabel = parsed.data.ownerLabel;
  }

  if (parsed.data.ownerId !== undefined) {
    updateData.ownerId = parsed.data.ownerId;
  }

  if (parsed.data.priority !== undefined) {
    updateData.priority = parsed.data.priority;
  }

  if (parsed.data.completed !== undefined) {
    updateData.completed = parsed.data.completed;
  }

  if (parsed.data.dueDate !== undefined) {
    updateData.dueDate = parsed.data.dueDate;
  }

  const [updatedTask] = await db
    .update(tasks)
    .set(updateData)
    .where(eq(tasks.id, parsedId.data))
    .returning();

  if (!updatedTask) {
    return NextResponse.json(
      { error: "Tarefa não encontrada." },
      { status: 404 },
    );
  }

  try {
    await db.insert(activities).values({
      userId: user.id,
      type: "engineering_task_updated",
      text: `Tarefa "${updatedTask.title}" actualizada.`,
      entityType: "task",
      entityId: updatedTask.id,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Tarefa actualizada, mas não foi possível registar a actividade.",
        data: updatedTask,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: updatedTask,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const authError = authorizeApi(user, ["admin"]);

  if (authError) {
    return authError;
  }

  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado." },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  const parsedId = idSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json(
      { error: "ID da tarefa inválido." },
      { status: 400 },
    );
  }

  const db = getDb();

  const [existingTask] = await db
    .select({
      id: tasks.id,
      title: tasks.title,
    })
    .from(tasks)
    .where(eq(tasks.id, parsedId.data))
    .limit(1);

  if (!existingTask) {
    return NextResponse.json(
      { error: "Tarefa não encontrada." },
      { status: 404 },
    );
  }

  const [deletedTask] = await db
    .delete(tasks)
    .where(eq(tasks.id, parsedId.data))
    .returning({
      id: tasks.id,
      title: tasks.title,
    });

  if (!deletedTask) {
    return NextResponse.json(
      { error: "Tarefa não encontrada." },
      { status: 404 },
    );
  }

  try {
    await db.insert(activities).values({
      userId: user.id,
      type: "engineering_task_deleted",
      text: `Tarefa "${deletedTask.title}" eliminada.`,
      entityType: "task",
      entityId: deletedTask.id,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Tarefa eliminada, mas não foi possível registar a actividade.",
        data: deletedTask,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: deletedTask,
  });
}
