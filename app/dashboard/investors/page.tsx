import { cookies, headers } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";

export const runtime = "edge";

type Investor = {
  id: string;
  name: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  status: "prospect" | "contacted" | "meeting" | "due_diligence" | "committed" | "closed" | "inactive";
  notes: string | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
};

type InvestorsResponse = {
  data: Investor[];
};

const statusLabels: Record<Investor["status"], string> = {
  prospect: "Prospect",
  contacted: "Contacted",
  meeting: "Meeting",
  due_diligence: "Due diligence",
  committed: "Committed",
  closed: "Closed",
  inactive: "Inactive",
};

function formatDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function InvestorsPage() {
  await requireRole(["admin", "investor"]);

  let investors: Investor[] = [];
  let errorMessage = "";

  try {
    // Reencaminha a sessão actual para que a API repita a autenticação e o RBAC no servidor.
    const requestHeaders = headers();
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

    if (!host) {
      throw new Error("Request host unavailable.");
    }

    const response = await fetch(`${protocol}://${host}/api/ops/investors`, {
      headers: { cookie: cookies().toString() },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as InvestorsResponse | { error?: string } | null;

    if (!response.ok) {
      errorMessage =
        payload && "error" in payload && payload.error
          ? payload.error
          : "Não foi possível carregar os investidores.";
    } else if (payload && "data" in payload && Array.isArray(payload.data)) {
      investors = payload.data;
    } else {
      errorMessage = "A resposta dos investidores é inválida.";
    }
  } catch {
    errorMessage = "Não foi possível carregar os investidores.";
  }

  return (
    <div className="ops-page">
      <section className="ops-card">
        <div className="card-header-row">
          <h2>Investors</h2>
          <span className="status-pill neutral">Pipeline</span>
        </div>
        {errorMessage ? <p className="empty-state">{errorMessage}</p> : null}

        {!errorMessage && investors.length === 0 ? (
          <p className="empty-state">Ainda não existem registos de investidores.</p>
        ) : null}

        {!errorMessage && investors.length > 0 ? (
          <div className="stack-list">
            {investors.map((investor) => (
              <div key={investor.id} className="stack-item">
                <div>
                  <strong>{investor.name}</strong>
                  {investor.organization ? <small>{investor.organization}</small> : null}
                  {investor.email ? <small>{investor.email}</small> : null}
                  {investor.phone ? <small>{investor.phone}</small> : null}
                  {investor.notes ? <small>{investor.notes}</small> : null}
                </div>
                <div className="stack-meta">
                  <span className="status-pill neutral">{statusLabels[investor.status]}</span>
                  {formatDate(investor.lastContactAt) ? (
                    <small>
                      Último contacto: <time dateTime={investor.lastContactAt ?? undefined}>{formatDate(investor.lastContactAt)}</time>
                    </small>
                  ) : null}
                  {formatDate(investor.nextFollowUpAt) ? (
                    <small>
                      Próximo contacto: <time dateTime={investor.nextFollowUpAt ?? undefined}>{formatDate(investor.nextFollowUpAt)}</time>
                    </small>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
