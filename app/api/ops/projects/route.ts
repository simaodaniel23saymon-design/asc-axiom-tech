import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { activities, projects, users } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { projectCreateSchema, projectsQuerySchema } from "@/lib/validation/projects";
import { getDb } from "@/lib/db";

export const runtime = "edge";

// Lista projectos operacionais para administradores e membros da equipa.
export async function GET(request: Request) {
  try {
    // Verifica a sessão e o role antes de permitir o acesso aos dados internos.
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    // O role investor não tem acesso aos dados operacionais dos projectos.
    if (authorizationError) {
      return authorizationError;
    }
  } catch (error) {
    console.error("[ops/projects] Falha ao processar a autorização.", error);

    // Não expõe detalhes internos da sessão, da BD ou da infraestrutura ao cliente.
    return NextResponse.json(
      { error: "Erro interno ao processar a autorização." },
      { status: 500 },
    );
  }

  // Valida os parâmetros recebidos pela URL antes de construir a consulta à BD.
  const query = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsedQuery = projectsQuerySchema.safeParse(query);

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Parâmetros inválidos.",
        details: parsedQuery.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const { page, limit, status, priority } = parsedQuery.data;
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [];

  if (status) {
    conditions.push(eq(projects.status, status));
  }

  if (priority) {
    conditions.push(eq(projects.priority, priority));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const db = getDb();

    // Obtém os dados e o total com os mesmos filtros, mantendo a paginação consistente.
    const [projectRows, totalRows] = await Promise.all([
      db
        .select({
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
        })
        .from(projects)
        .where(where)
        .orderBy(desc(projects.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(projects).where(where),
    ]);

    const total = totalRows[0]?.total ?? 0;

    return NextResponse.json({
      data: projectRows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ops/projects] Falha ao consultar projectos.", error);

    // Não expõe stack traces, credenciais ou detalhes internos da BD ao cliente.
    return NextResponse.json(
      { error: "Erro interno ao consultar os projectos." },
      { status: 500 },
    );
  }
}

// Cria um projecto operacional e regista a actividade correspondente.
export async function POST(request: Request) {
  try {
    // Verifica a sessão e o role antes de permitir a criação de dados internos.
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "team"]);

    // O role investor não pode criar nem alterar projectos operacionais.
    if (authorizationError) {
      return authorizationError;
    }

    // Valida e restringe o payload aos campos permitidos para criação.
    const payload = await request.json().catch(() => null);
    const parsedPayload = projectCreateSchema.safeParse(payload);

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
    const { ownerId, ...projectData } = parsedPayload.data;

    // Confirma que ownerId aponta para um utilizador existente antes de inserir.
    if (ownerId) {
      const owner = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, ownerId))
        .limit(1);

      if (owner.length === 0) {
        return NextResponse.json(
          { error: "Dados inválidos.", details: [{ path: ["ownerId"], message: "Utilizador inexistente." }] },
          { status: 400 },
        );
      }
    }

    // O cliente neon-http não suporta transacções Drizzle; por isso o erro da
    // actividade é devolvido como 500 e nunca como um falso sucesso.
    const [createdProject] = await db
      .insert(projects)
      .values({ ...projectData, ownerId })
      .returning({
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
      });

    await db.insert(activities).values({
      userId: user!.id,
      type: "project_created",
      text: `Projecto criado: ${createdProject.name}`,
      entityType: "project",
      entityId: createdProject.id,
    });

    return NextResponse.json({ data: createdProject }, { status: 201 });
  } catch (error) {
    console.error("[ops/projects] Falha ao criar projecto.", error);

    // Não expõe stack traces, credenciais ou detalhes internos ao cliente.
    return NextResponse.json(
      { error: "Erro interno ao criar o projecto." },
      { status: 500 },
    );
  }
}