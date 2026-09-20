import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  activities,
  milestones,
  projects,
  roadmap,
} from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { engineeringMilestoneUpdateSchema } from "@/lib/validation/engineering";

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
      { error: "ID do marco inválido." },
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

  const parsed = engineeringMilestoneUpdateSchema.safeParse(body);

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

  const [existingMilestone] = await db
    .select({
      id: milestones.id,
      title: milestones.title,
    })
    .from(milestones)
    .where(eq(milestones.id, parsedId.data))
    .limit(1);

  if (!existingMilestone) {
    return NextResponse.json(
      { error: "Marco não encontrado." },
      { status: 404 },
    );
  }

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

  if (parsed.data.roadmapId) {
    const [roadmapEntry] = await db
      .select({ id: roadmap.id })
      .from(roadmap)
      .where(eq(roadmap.id, parsed.data.roadmapId))
      .limit(1);

    if (!roadmapEntry) {
      return NextResponse.json(
        { error: "Item do roadmap não encontrado." },
        { status: 400 },
      );
    }
  }

  const updateData: Partial<typeof milestones.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.data.projectId !== undefined) {
    updateData.projectId = parsed.data.projectId;
  }

  if (parsed.data.roadmapId !== undefined) {
    updateData.roadmapId = parsed.data.roadmapId;
  }

  if (parsed.data.title !== undefined) {
    updateData.title = parsed.data.title;
  }

  if (parsed.data.description !== undefined) {
    updateData.description = parsed.data.description;
  }

  if (parsed.data.status !== undefined) {
    updateData.status = parsed.data.status;
  }

  if (parsed.data.progress !== undefined) {
    updateData.progress = parsed.data.progress;
  }

  if (parsed.data.dueDate !== undefined) {
    updateData.dueDate = parsed.data.dueDate;
  }

  const [updatedMilestone] = await db
    .update(milestones)
    .set(updateData)
    .where(eq(milestones.id, parsedId.data))
    .returning();

  if (!updatedMilestone) {
    return NextResponse.json(
      { error: "Marco não encontrado." },
      { status: 404 },
    );
  }

  try {
    await db.insert(activities).values({
      userId: user.id,
      type: "engineering_milestone_updated",
      text: `Marco "${updatedMilestone.title}" actualizado.`,
      entityType: "milestone",
      entityId: updatedMilestone.id,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Marco actualizado, mas não foi possível registar a actividade.",
        data: updatedMilestone,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: updatedMilestone,
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
      { error: "ID do marco inválido." },
      { status: 400 },
    );
  }

  const db = getDb();

  const [existingMilestone] = await db
    .select({
      id: milestones.id,
      title: milestones.title,
    })
    .from(milestones)
    .where(eq(milestones.id, parsedId.data))
    .limit(1);

  if (!existingMilestone) {
    return NextResponse.json(
      { error: "Marco não encontrado." },
      { status: 404 },
    );
  }

  const [deletedMilestone] = await db
    .delete(milestones)
    .where(eq(milestones.id, parsedId.data))
    .returning({
      id: milestones.id,
      title: milestones.title,
    });

  if (!deletedMilestone) {
    return NextResponse.json(
      { error: "Marco não encontrado." },
      { status: 404 },
    );
  }

  try {
    await db.insert(activities).values({
      userId: user.id,
      type: "engineering_milestone_deleted",
      text: `Marco "${deletedMilestone.title}" eliminado.`,
      entityType: "milestone",
      entityId: deletedMilestone.id,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Marco eliminado, mas não foi possível registar a actividade.",
        data: deletedMilestone,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: deletedMilestone,
  });
}
