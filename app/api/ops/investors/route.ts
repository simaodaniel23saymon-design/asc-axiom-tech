import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { investors } from "@/db/schema";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export const runtime = "edge";

// Lista investidores autorizados sem expor campos internos de controlo da BD.
export async function GET() {
  try {
    // Verifica a sessão e o role antes de permitir o acesso aos dados internos.
    const user = await getCurrentUser();
    const authorizationError = authorizeApi(user, ["admin", "investor"]);

    if (authorizationError) {
      return authorizationError;
    }
  } catch (error) {
    console.error("[ops/investors] Falha ao processar a autorização.", error);

    // Não expõe detalhes internos da sessão, da BD ou da infraestrutura ao cliente.
    return NextResponse.json(
      { error: "Erro interno ao processar a autorização." },
      { status: 500 },
    );
  }

  try {
    const db = getDb();

    // Selecciona apenas os campos necessários para a consulta interna de investidores.
    const investorRows = await db
      .select({
        id: investors.id,
        name: investors.name,
        organization: investors.organization,
        email: investors.email,
        phone: investors.phone,
        status: investors.status,
        notes: investors.notes,
        lastContactAt: investors.lastContactAt,
        nextFollowUpAt: investors.nextFollowUpAt,
      })
      .from(investors)
      .orderBy(asc(investors.createdAt), asc(investors.id));

    return NextResponse.json({ data: investorRows });
  } catch (error) {
    console.error("[ops/investors] Falha ao consultar investidores.", error);

    // Não expõe stack traces, credenciais ou detalhes internos da BD ao cliente.
    return NextResponse.json(
      { error: "Erro interno ao consultar investidores." },
      { status: 500 },
    );
  }
}