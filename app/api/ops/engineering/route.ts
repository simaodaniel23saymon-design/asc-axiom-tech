import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { milestones, projects, tasks } from "@/db/schema";

export const runtime = "edge";

// Agrega dados operacionais existentes para a visão de Engineering.
export async function GET() {
  try {
    // Verifica a sessão e o role antes de permitir o acesso aos dados internos.
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
    }
  } catch (error) {
    console.error("[ops/engineering] Falha ao processar a autorização.", error);

    // Não expõe detalhes internos da sessão, da BD ou da infraestrutura ao cliente.
    return NextResponse.json(
      { error: "Erro interno ao processar a autorização." },
      { status: 500 },
    );
  }

  try {
    const db = getDb();

    // Consulta as três áreas operacionais em paralelo, sem usar dados mock.
    const [projectRows, milestoneRows, taskRows] = await Promise.all([
      db
        .select({
          id: projects.id,
          name: projects.name,
          status: projects.status,
          priority: projects.priority,
          progress: projects.progress,
          responsible: projects.ownerLabel,
          deadline: projects.deadline,
        })
        .from(projects)
        .orderBy(asc(projects.createdAt), asc(projects.id)),
      db
        .select({
          id: milestones.id,
          projectId: milestones.projectId,
          title: milestones.title,
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
          priority: tasks.priority,
          ownerLabel: tasks.ownerLabel,
          completed: tasks.completed,
          dueDate: tasks.dueDate,
        })
        .from(tasks)
        .orderBy(asc(tasks.createdAt), asc(tasks.id)),
    ]);

    return NextResponse.json({
      data: {
        projects: projectRows,
        milestones: milestoneRows,
        tasks: taskRows,
      },
    });
  } catch (error) {
    console.error("[ops/engineering] Falha ao consultar dados operacionais.", error);

    // Não expõe stack traces, credenciais ou detalhes internos da BD ao cliente.
    return NextResponse.json(
      { error: "Erro interno ao consultar dados de Engineering." },
      { status: 500 },
    );
  }
}