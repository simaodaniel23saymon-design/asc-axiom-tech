import { dashboardSummary, goals, tasks, activities } from "@/lib/data/ops";

export const runtime = "edge";

export default function DashboardOverviewPage() {
  return (
    <div className="ops-page">
      <section className="stats-grid">
        {dashboardSummary.map((item) => (
          <article key={item.label} className="ops-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.delta}</small>
          </article>
        ))}
      </section>

      <section className="content-grid two-col">
        <article className="ops-card">
          <div className="card-header-row">
            <h2>Priority tasks</h2>
            <span className="status-pill neutral">Live</span>
          </div>
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.title} className="task-item">
                <div>
                  <strong>{task.title}</strong>
                  <small>{task.owner}</small>
                </div>
                <div className="task-meta">
                  <span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
                  <time>{task.due}</time>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="ops-card">
          <div className="card-header-row">
            <h2>Goals</h2>
            <span className="status-pill neutral">Tracker</span>
          </div>
          <div className="goal-list">
            {goals.map((goal) => (
              <div key={goal.title} className="goal-row">
                <div className="goal-header">
                  <span>{goal.title}</span>
                  <strong>{goal.progress}%</strong>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${goal.progress}%` }} />
                </div>
                <small>{goal.target}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="ops-card">
        <div className="card-header-row">
          <h2>Recent activity</h2>
          <span className="status-pill neutral">Updated today</span>
        </div>
        <ul className="activity-list">
          {activities.map((item) => (
            <li key={`${item.time}-${item.text}`}>
              <time>{item.time}</time>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
