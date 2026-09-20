import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  activities,
  milestones,
  projects,
  roadmap,
  tasks,
  users,
} from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import {
  engineeringMilestoneCreateSchema,
  engineeringProjectCreateSchema,
  engineeringTaskCreateSchema,
} from "@/lib/validation/engineering";

export const runtime = "edge";

// Agrega dados operacionais existentes para a visão de Engineering.
export async function GET() {
  try {
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
    }
  } catch (error) {
    console.error("[ops/engineering] Falha ao processar a autorização.", error);

    return NextResponse.json(
      { error: "Erro interno ao processar a autorização." },
      { status: 500 },
    );
  }

  try {
    const db = getDb();

    const [
      projectRows,
      milestoneRows,
      taskRows,
      userRows,
      roadmapRows,
    ] = await Promise.all([
      db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status,
          priority: projects.priority,
          progress: projects.progress,
          responsible: projects.ownerLabel,
          ownerId: projects.ownerId,
          startDate: projects.startDate,
          deadline: projects.deadline,
        })
        .from(projects)
        .orderBy(asc(projects.createdAt), asc(projects.id)),

      db
        .select({
          id: milestones.id,
          projectId: milestones.projectId,
          roadmapId: milestones.roadmapId,
          title: milestones.title,
          description: milestones.description,
          status: milestones.status,
          progress: milestones.progress,
          dueDate: milestones.dueDate,
        })
        .from(milestones)
        .orderBy(asc(milestones.createdAt), asc(milestones.id)),

      db
        .select({
          id: tasks.id,
          projectId: tasks.projectId,
          milestoneId: tasks.milestoneId,
          title: tasks.title,
          description: tasks.description,
          priority: tasks.priority,
          ownerLabel: tasks.ownerLabel,
          ownerId: tasks.ownerId,
          completed: tasks.completed,
          dueDate: tasks.dueDate,
        })
        .from(tasks)
        .orderBy(asc(tasks.createdAt), asc(tasks.id)),

      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
        })
        .from(users)
        .orderBy(asc(users.name), asc(users.id)),

      db
        .select({
          id: roadmap.id,
          phase: roadmap.phase,
          title: roadmap.title,
          description: roadmap.description,
          status: roadmap.status,
          priority: roadmap.priority,
          startDate: roadmap.startDate,
          deadline: roadmap.deadline,
        })
        .from(roadmap)
        .orderBy(asc(roadmap.createdAt), asc(roadmap.id)),
    ]);

    return NextResponse.json({
      data: {
        projects: projectRows,
        milestones: milestoneRows,
        tasks: taskRows,
        users: userRows,
        roadmaps: roadmapRows,
      },
    });
  } catch (error) {
    console.error(
      "[ops/engineering] Falha ao consultar dados operacionais.",
      error,
    );

    return NextResponse.json(
      { error: "Erro interno ao consultar dados de Engineering." },
      { status: 500 },
    );
  }
}

// Cria Project, Milestone ou Task.
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const payload = await request.json().catch(() => null);

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return NextResponse.json(
        { error: "Dados inválidos." },
        { status: 400 },
      );
    }

    const entity = (payload as { entity?: unknown }).entity;
    const data = (payload as { data?: unknown }).data;

    if (
      entity !== "project" &&
      entity !== "milestone" &&
      entity !== "task"
    ) {
      return NextResponse.json(
        {
          error: "Entidade inválida.",
          details: [
            {
              path: ["entity"],
              message: "Use project, milestone ou task.",
            },
          ],
        },
        { status: 400 },
      );
    }

    if (data === undefined) {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
          details: [
            {
              path: ["data"],
              message: "O campo data é obrigatório.",
            },
          ],
        },
        { status: 400 },
      );
    }

    const db = getDb();

    if (entity === "project") {
      const parsed = engineeringProjectCreateSchema.safeParse(data);

      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Dados inválidos.",
            details: parsed.error.issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
            })),
          },
          { status: 400 },
        );
      }

      const { ownerId, ...projectData } = parsed.data;

      if (ownerId) {
        const owner = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, ownerId))
          .limit(1);

        if (owner.length === 0) {
          return NextResponse.json(
            {
              error: "Dados inválidos.",
              details: [
                {
                  path: ["ownerId"],
                  message: "Utilizador inexistente.",
                },
              ],
            },
            { status: 400 },
          );
        }
      }

      const [createdProject] = await db
        .insert(projects)
        .values({
          ...projectData,
          ownerId,
        })
        .returning();

      await db.insert(activities).values({
        userId: user.id,
        type: "engineering_project_created",
        text: `Projecto criado: ${createdProject.name}`,
        entityType: "project",
        entityId: createdProject.id,
      });

      return NextResponse.json(
        { data: createdProject },
        { status: 201 },
      );
    }

    if (entity === "milestone") {
      const parsed = engineeringMilestoneCreateSchema.safeParse(data);

      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Dados inválidos.",
            details: parsed.error.issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
            })),
          },
          { status: 400 },
        );
      }

      const { projectId, roadmapId, ...milestoneData } = parsed.data;

      if (projectId) {
        const project = await db
          .select({ id: projects.id })
          .from(projects)
          .where(eq(projects.id, projectId))
          .limit(1);

        if (project.length === 0) {
          return NextResponse.json(
            {
              error: "Dados inválidos.",
              details: [
                {
                  path: ["projectId"],
                  message: "Projecto inexistente.",
                },
              ],
            },
            { status: 400 },
          );
        }
      }

      if (roadmapId) {
        const roadmapRow = await db
          .select({ id: roadmap.id })
          .from(roadmap)
          .where(eq(roadmap.id, roadmapId))
          .limit(1);

        if (roadmapRow.length === 0) {
          return NextResponse.json(
            {
              error: "Dados inválidos.",
              details: [
                {
                  path: ["roadmapId"],
                  message: "Roadmap inexistente.",
                },
              ],
            },
            { status: 400 },
          );
        }
      }

      const [createdMilestone] = await db
        .insert(milestones)
        .values({
          ...milestoneData,
          projectId,
          roadmapId,
        })
        .returning();

      await db.insert(activities).values({
        userId: user.id,
        type: "engineering_milestone_created",
        text: `Milestone criado: ${createdMilestone.title}`,
        entityType: "milestone",
        entityId: createdMilestone.id,
      });

      return NextResponse.json(
        { data: createdMilestone },
        { status: 201 },
      );
    }

    const parsed = engineeringTaskCreateSchema.safeParse(data);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
          details: parsed.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const {
      projectId,
      milestoneId,
      ownerId,
      ...taskData
    } = parsed.data;

    if (projectId) {
      const project = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (project.length === 0) {
        return NextResponse.json(
          {
            error: "Dados inválidos.",
            details: [
              {
                path: ["projectId"],
                message: "Projecto inexistente.",
              },
            ],
          },
          { status: 400 },
        );
      }
    }

    if (milestoneId) {
      const milestone = await db
        .select({
          id: milestones.id,
          projectId: milestones.projectId,
        })
        .from(milestones)
        .where(eq(milestones.id, milestoneId))
        .limit(1);

      if (milestone.length === 0) {
        return NextResponse.json(
          {
            error: "Dados inválidos.",
            details: [
              {
                path: ["milestoneId"],
                message: "Milestone inexistente.",
              },
            ],
          },
          { status: 400 },
        );
      }

      if (
        projectId &&
        milestone[0].projectId &&
        milestone[0].projectId !== projectId
      ) {
        return NextResponse.json(
          {
            error: "Dados inválidos.",
            details: [
              {
                path: ["milestoneId"],
                message:
                  "O milestone não pertence ao projecto indicado.",
              },
            ],
          },
          { status: 400 },
        );
      }
    }

    if (ownerId) {
      const owner = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, ownerId))
        .limit(1);

      if (owner.length === 0) {
        return NextResponse.json(
          {
            error: "Dados inválidos.",
            details: [
              {
                path: ["ownerId"],
                message: "Utilizador inexistente.",
              },
            ],
          },
          { status: 400 },
        );
      }
    }

    const [createdTask] = await db
      .insert(tasks)
      .values({
        ...taskData,
        projectId,
        milestoneId,
        ownerId,
      })
      .returning();

    await db.insert(activities).values({
      userId: user.id,
      type: "engineering_task_created",
      text: `Task criada: ${createdTask.title}`,
      entityType: "task",
      entityId: createdTask.id,
    });

    return NextResponse.json(
      { data: createdTask },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "[ops/engineering] Falha ao criar entidade.",
      error,
    );

    return NextResponse.json(
      { error: "Erro interno ao criar a entidade de Engineering." },
      { status: 500 },
    );
  }
}
