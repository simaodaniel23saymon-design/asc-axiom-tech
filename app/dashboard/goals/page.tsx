import { goals } from "@/lib/data/ops";

export default function GoalsPage() {
  return (
    <div className="ops-page">
      <section className="ops-card">
        <div className="card-header-row">
          <h2>Company goals</h2>
          <span className="status-pill neutral">Strategic</span>
        </div>

        <div className="goal-list expanded">
          {goals.map((goal) => (
            <div key={goal.title} className="goal-row">
              <div className="goal-header">
                <span>{goal.title}</span>
                <strong>{goal.progress}%</strong>
              </div>
              <div className="progress-track large">
                <span style={{ width: `${goal.progress}%` }} />
              </div>
              <small>{goal.target}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
