import { roadmap } from "@/lib/data/ops";

export default function RoadmapPage() {
  return (
    <div className="ops-page">
      <section className="ops-card">
        <div className="card-header-row">
          <h2>Roadmap</h2>
          <span className="status-pill neutral">Execution</span>
        </div>

        <div className="timeline-list">
          {roadmap.map((item) => (
            <div key={item.phase} className="timeline-item">
              <div className="timeline-phase">{item.phase}</div>
              <div>
                <strong>{item.title}</strong>
                <span>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
