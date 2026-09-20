import { getCurrentUser } from "@/lib/auth/session";
import { getOverviewData } from "@/lib/ops/overview";
export const runtime = "edge";
type T = {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  ownerLabel: string | null;
  dueDate: Date | null;
  project: { id: string; name: string } | null;
};
type G = {
  id: string;
  title: string;
  progress: number;
  target: string | null;
  deadline: Date | null;
};
type O = {
  kpis: {
    activeProjects: number;
    blockedProjects: number;
    goalsOnTrack: number;
    goalsAtRisk: number;
    overdueTasks: number;
    tasksDueNext7Days: number;
    overdueMilestones: number;
    milestonesDueNext14Days: number;
    activeTeamMembers: number;
  };
  lists: {
    overdueTasks: T[];
    upcomingTasks: T[];
    atRiskGoals: G[];
  };
};
function date(v: string | Date | null, time = false) {
  if (!v) return "Data indisponível";

  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "Data indisponível"
    : new Intl.DateTimeFormat(
        "pt-PT",
        time
          ? {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }
          : { day: "2-digit", month: "short", year: "numeric" },
      ).format(d);
}
export default async function DashboardOverviewPage() {
  let o: O | null = null,
    e = "";

  try {
    const user = await getCurrentUser();

    if (!user) {
      e = "Sessão inválida. Faça novamente o login.";
    } else if (user.role !== "admin" && user.role !== "team") {
      e = "Não tem permissão para consultar a Overview.";
    } else {
      o = await getOverviewData(user);
    }
  } catch (error) {
    console.error("[dashboard] Falha ao carregar a Overview.", error);
    e = "Erro interno ao consultar dados da Overview.";
  }

  const ts = o ? [...o.lists.overdueTasks, ...o.lists.upcomingTasks] : [];
  return (
    <div className="ops-page">
      {e ? <p className="empty-state">{e}</p> : null}
      {o ? (
        <>
          <section className="dashboard-kpi-grid">
            <a href="/dashboard/projects" className="dashboard-kpi-card">
              <div className="dashboard-kpi-top">
                <span className="dashboard-kpi-label">Projectos activos</span>
                <span className="dashboard-kpi-icon" aria-hidden="true">↗</span>
              </div>
              <strong className="dashboard-kpi-value">
                {o.kpis.activeProjects}
              </strong>
              <div className="dashboard-kpi-footer">
                <span className={o.kpis.blockedProjects > 0 ? "dashboard-kpi-alert" : ""}>
                  {o.kpis.blockedProjects} bloqueado{o.kpis.blockedProjects === 1 ? "" : "s"}
                </span>
                <span>Projectos</span>
              </div>
            </a>

            <a href="/dashboard/goals" className="dashboard-kpi-card">
              <div className="dashboard-kpi-top">
                <span className="dashboard-kpi-label">Objectivos em progresso</span>
                <span className="dashboard-kpi-icon" aria-hidden="true">◎</span>
              </div>
              <strong className="dashboard-kpi-value">
                {o.kpis.goalsOnTrack}
              </strong>
              <div className="dashboard-kpi-footer">
                <span className={o.kpis.goalsAtRisk > 0 ? "dashboard-kpi-alert" : ""}>
                  {o.kpis.goalsAtRisk} em risco
                </span>
                <span>Objectivos</span>
              </div>
            </a>

            <a href="/dashboard/engineering" className="dashboard-kpi-card">
              <div className="dashboard-kpi-top">
                <span className="dashboard-kpi-label">Tasks · próximos 7 dias</span>
                <span className="dashboard-kpi-icon" aria-hidden="true">✓</span>
              </div>
              <strong className="dashboard-kpi-value">
                {o.kpis.tasksDueNext7Days}
              </strong>
              <div className="dashboard-kpi-footer">
                <span className={o.kpis.overdueTasks > 0 ? "dashboard-kpi-alert" : ""}>
                  {o.kpis.overdueTasks} em atraso
                </span>
                <span>Planeamento</span>
              </div>
            </a>

            <a href="/dashboard/team" className="dashboard-kpi-card">
              <div className="dashboard-kpi-top">
                <span className="dashboard-kpi-label">Membros activos</span>
                <span className="dashboard-kpi-icon" aria-hidden="true">●</span>
              </div>
              <strong className="dashboard-kpi-value">
                {o.kpis.activeTeamMembers}
              </strong>
              <div className="dashboard-kpi-footer">
                <span>
                  {o.kpis.milestonesDueNext14Days} milestone{o.kpis.milestonesDueNext14Days === 1 ? "" : "s"} próximos
                </span>
                <span>{o.kpis.overdueMilestones} em atraso</span>
              </div>
            </a>
          </section>
          <section className="dashboard-main-grid">
            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <span className="dashboard-panel-eyebrow">Execução</span>
                  <h2>Tasks prioritárias</h2>
                  <p>Acompanhe tarefas atrasadas e com prazo próximo.</p>
                </div>
                <a href="/dashboard/engineering" className="dashboard-panel-link">
                  Ver engenharia <span aria-hidden="true">→</span>
                </a>
              </div>

              {ts.length === 0 ? (
                <div className="dashboard-empty">
                  <span className="dashboard-empty-icon" aria-hidden="true">✓</span>
                  <div>
                    <strong>Sem tarefas pendentes</strong>
                    <span>Não existem tasks atrasadas ou próximas.</span>
                  </div>
                </div>
              ) : (
                <ul className="dashboard-task-list">
                  {ts.map((t) => {
                    const overdue = t.dueDate ? t.dueDate.getTime() < Date.now() : false;

                    return (
                      <li key={t.id}>
                        <a href="/dashboard/engineering" className="dashboard-task-item">
                          <div className="dashboard-task-main">
                            <div className="dashboard-task-title-row">
                              <span
                                className={`dashboard-task-indicator ${
                                  overdue ? "overdue" : "upcoming"
                                }`}
                                aria-hidden="true"
                              />
                              <strong>{t.title}</strong>
                            </div>

                            <div className="dashboard-task-context">
                              <span>{t.ownerLabel ?? "Sem responsável"}</span>
                              {t.project ? (
                                <span>{t.project.name}</span>
                              ) : null}
                            </div>
                          </div>

                          <div className="dashboard-task-meta">
                            <span className={"priority-badge " + t.priority}>
                              {t.priority === "high"
                                ? "Alta"
                                : t.priority === "medium"
                                  ? "Média"
                                  : "Baixa"}
                            </span>
                            <time
                              className={overdue ? "dashboard-task-date overdue" : ""}
                              dateTime={t.dueDate?.toISOString()}
                            >
                              {date(t.dueDate)}
                            </time>
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <span className="dashboard-panel-eyebrow">Atenção</span>
                  <h2>Objectivos em risco</h2>
                  <p>Objectivos que precisam de acompanhamento.</p>
                </div>
                <span className="dashboard-risk-count">
                  {o.kpis.goalsAtRisk}
                </span>
              </div>

              {o.lists.atRiskGoals.length === 0 ? (
                <div className="dashboard-empty">
                  <span className="dashboard-empty-icon" aria-hidden="true">✓</span>
                  <div>
                    <strong>Nenhum objectivo em risco</strong>
                    <span>Todos os objectivos estão sem alerta de risco.</span>
                  </div>
                </div>
              ) : (
                <div className="dashboard-goal-list">
                  {o.lists.atRiskGoals.map((g) => (
                    <a href="/dashboard/goals" key={g.id} className="dashboard-goal-item">
                      <div className="dashboard-goal-header">
                        <strong>{g.title}</strong>
                        <span>{g.progress}%</span>
                      </div>

                      <div className="dashboard-goal-progress" aria-hidden="true">
                        <span style={{ width: `${Math.min(100, Math.max(0, g.progress))}%` }} />
                      </div>

                      <div className="dashboard-goal-footer">
                        {g.target ? <span>{g.target}</span> : <span>Sem meta definida</span>}
                        {g.deadline ? (
                          <time dateTime={g.deadline.toISOString()}>
                            Prazo · {date(g.deadline)}
                          </time>
                        ) : (
                          <span>Sem prazo</span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
