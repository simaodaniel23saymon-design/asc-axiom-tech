import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/authorize-api";
import { getCurrentUser } from "@/lib/auth/session";
import { getOverviewData } from "@/lib/ops/overview";

export const runtime = "edge";

export async function GET() {
  let user;

  try {
    user = await getCurrentUser();

    const authorizationError = authorizeApi(user, ["admin", "team"]);

    if (authorizationError) {
      return authorizationError;
    }
  } catch (error) {
    console.error("[ops/overview] Falha ao processar a autorização.", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a autorização." },
      { status: 500 },
    );
  }

  try {
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 },
      );
    }

    const response = await getOverviewData(user);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[ops/overview] Falha ao consultar dados da Overview.", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar dados da Overview." },
      { status: 500 },
    );
  }
}
