import { cookies, headers } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
export const runtime = "edge";
type T = {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  ownerLabel: string | null;
  dueDate: string;
  project: { id: string; name: string } | null;
};
type G = {
  id: string;
  title: string;
  progress: number;
  target: string | null;
  deadline: string | null;
};
type A = {
  id: string;
  text: string;
  createdAt: string;
  actorName: string | null;
  entityType: string | null;
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
    recentActivities: A[];
  };
};
function date(v: string, time = false) {
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
function activityHref(entityType: string | null) {
  if (entityType === "project") return "/dashboard/projects";
  if (entityType === "goal") return "/dashboard/goals";
  if (entityType === "roadmap") return "/dashboard/roadmap";
  return null;
}

export default async function DashboardOverviewPage() {
  await requireRole(["admin", "team"]);
  let o: O | null = null,
    e = "";
  try {
    const h = headers(),
      p = h.get("x-forwarded-proto") ?? "http",
      host = h.get("x-forwarded-host") ?? h.get("host");
    if (!host) throw Error();
    const r = await fetch(p + "://" + host + "/api/ops/overview", {
        headers: { cookie: cookies().toString() },
        cache: "no-store",
      }),
      x = (await r.json().catch(() => null)) as O | { error?: string } | null;
    if (!r.ok)
      e =
        x && "error" in x && x.error
          ? x.error
          : "Não foi possível carregar a Overview.";
    else if (
      x &&
      "kpis" in x &&
      "lists" in x &&
      Array.isArray(x.lists.overdueTasks) &&
      Array.isArray(x.lists.upcomingTasks) &&
      Array.isArray(x.lists.atRiskGoals) &&
      Array.isArray(x.lists.recentActivities)
    )
      o = x;
    else e = "A resposta da Overview é inválida.";
  } catch {
    e = "Não foi possível carregar a Overview.";
  }
  const ts = o ? [...o.lists.overdueTasks, ...o.lists.upcomingTasks] : [];
  return (
    <div className="ops-page">
      {e ? <p className="empty-state">{e}</p> : null}
      {o ? (
        <>
          <section className="stats-grid">
            <a href="/dashboard/projects" className="ops-card">
              <span>Active projects</span>
              <strong>{o.kpis.activeProjects}</strong>
              <small>{o.kpis.blockedProjects} blocked</small>
            </a>
            <a href="/dashboard/goals" className="ops-card">
              <span>Goals on track</span>
              <strong>{o.kpis.goalsOnTrack}</strong>
              <small>{o.kpis.goalsAtRisk} at risk</small>
            </a>
            <a href="/dashboard/engineering" className="ops-card">
              <span>Tasks due next 7 days</span>
              <strong>{o.kpis.tasksDueNext7Days}</strong>
              <small>{o.kpis.overdueTasks} overdue</small>
            </a>
            <a href="/dashboard/team" className="ops-card">
              <span>Active team members</span>
              <strong>{o.kpis.activeTeamMembers}</strong>
              <small>
                {o.kpis.milestonesDueNext14Days} milestones due ·{" "}
                {o.kpis.overdueMilestones} overdue
              </small>
            </a>
          </section>
          <section className="content-grid two-col">
            <article className="ops-card">
              <div className="card-header-row">
                <h2>Priority tasks</h2>
                <span className="status-pill neutral">Due dates</span>
              </div>
              {ts.length === 0 ? (
                <p className="empty-state">No overdue or upcoming tasks.</p>
              ) : (
                <ul className="task-list">
                  {ts.map((t) => (
                    <li key={t.id}>
                      <a href="/dashboard/engineering" className="task-item">
                        <div>
                          <strong>{t.title}</strong>
                          <small>
                            {t.ownerLabel ?? "Unassigned"}
                            {t.project ? " · " + t.project.name : ""}
                          </small>
                        </div>
                        <div className="task-meta">
                          <span className={"priority-badge " + t.priority}>
                            {t.priority}
                          </span>
                          <time dateTime={t.dueDate}>{date(t.dueDate)}</time>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </article>
            <article className="ops-card">
              <div className="card-header-row">
                <h2>Goals at risk</h2>
                <span className="status-pill neutral">
                  {o.kpis.goalsAtRisk}
                </span>
              </div>
              {o.lists.atRiskGoals.length === 0 ? (
                <p className="empty-state">
                  No goals are currently marked at risk.
                </p>
              ) : (
                <div className="goal-list">
                  {o.lists.atRiskGoals.map((g) => (
                    <a href="/dashboard/goals" key={g.id} className="goal-row">
                      <div className="goal-header">
                        <span>{g.title}</span>
                        <strong>{g.progress}%</strong>
                      </div>
                      <div className="progress-track">
                        <span style={{ width: g.progress + "%" }} />
                      </div>
                      {g.target ? <small>{g.target}</small> : null}
                      {g.deadline ? (
                        <small>
                          Deadline:{" "}
                          <time dateTime={g.deadline}>{date(g.deadline)}</time>
                        </small>
                      ) : null}
                    </a>
                  ))}
                </div>
              )}
            </article>
          </section>
          <section className="ops-card">
            <div className="card-header-row">
              <h2>Recent activity</h2>
              <span className="status-pill neutral">Latest records</span>
            </div>
            {o.lists.recentActivities.length === 0 ? (
              <p className="empty-state">
                No recent activity has been recorded.
              </p>
            ) : (
              <ul className="activity-list">
                {o.lists.recentActivities.map((a) => {
                  const href = activityHref(a.entityType);
                  const content = (
                    <>
                      <time dateTime={a.createdAt}>
                        {date(a.createdAt, true)}
                      </time>
                      <p>
                        {a.actorName ? <strong>{a.actorName}: </strong> : null}
                        {a.text}
                      </p>
                    </>
                  );

                  return href ? (
                    <li key={a.id}>
                      <a href={href}>{content}</a>
                    </li>
                  ) : (
                    <li key={a.id}>{content}</li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
