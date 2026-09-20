import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { activities, projects, users } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { engineeringProjectUpdateSchema } from "@/lib/validation/engineering";

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
      { error: "ID do projecto inválido." },
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

  const parsed = engineeringProjectUpdateSchema.safeParse(body);

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

  const [existingProject] = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.id, parsedId.data))
    .limit(1);

  if (!existingProject) {
    return NextResponse.json(
      { error: "Projecto não encontrado." },
      { status: 404 },
    );
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

  const updateData: Partial<typeof projects.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.data.name !== undefined) {
    updateData.name = parsed.data.name;
  }

  if (parsed.data.description !== undefined) {
    updateData.description = parsed.data.description;
  }

  if (parsed.data.status !== undefined) {
    updateData.status = parsed.data.status;
  }

  if (parsed.data.priority !== undefined) {
    updateData.priority = parsed.data.priority;
  }

  if (parsed.data.progress !== undefined) {
    updateData.progress = parsed.data.progress;
  }

  if (parsed.data.ownerLabel !== undefined) {
    updateData.ownerLabel = parsed.data.ownerLabel;
  }

  if (parsed.data.ownerId !== undefined) {
    updateData.ownerId = parsed.data.ownerId;
  }

  if (parsed.data.startDate !== undefined) {
    updateData.startDate = parsed.data.startDate;
  }

  if (parsed.data.deadline !== undefined) {
    updateData.deadline = parsed.data.deadline;
  }

  const [updatedProject] = await db
    .update(projects)
    .set(updateData)
    .where(eq(projects.id, parsedId.data))
    .returning();

  if (!updatedProject) {
    return NextResponse.json(
      { error: "Projecto não encontrado." },
      { status: 404 },
    );
  }

  try {
    await db.insert(activities).values({
      userId: user.id,
      type: "engineering_project_updated",
      text: `Projecto "${updatedProject.name}" actualizado.`,
      entityType: "project",
      entityId: updatedProject.id,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Projecto actualizado, mas não foi possível registar a actividade.",
        data: updatedProject,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: updatedProject,
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
      { error: "ID do projecto inválido." },
      { status: 400 },
    );
  }

  const db = getDb();

  const [existingProject] = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.id, parsedId.data))
    .limit(1);

  if (!existingProject) {
    return NextResponse.json(
      { error: "Projecto não encontrado." },
      { status: 404 },
    );
  }

  const [deletedProject] = await db
    .delete(projects)
    .where(eq(projects.id, parsedId.data))
    .returning({
      id: projects.id,
      name: projects.name,
    });

  if (!deletedProject) {
    return NextResponse.json(
      { error: "Projecto não encontrado." },
      { status: 404 },
    );
  }

  try {
    await db.insert(activities).values({
      userId: user.id,
      type: "engineering_project_deleted",
      text: `Projecto "${deletedProject.name}" eliminado.`,
      entityType: "project",
      entityId: deletedProject.id,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Projecto eliminado, mas não foi possível registar a actividade.",
        data: deletedProject,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: deletedProject,
  });
}
