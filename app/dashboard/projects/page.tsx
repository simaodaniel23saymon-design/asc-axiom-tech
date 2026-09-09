import { projects } from "@/lib/data/ops";

export default function ProjectsPage() {
  return (
    <div className="ops-page">
      <section className="ops-card">
        <div className="card-header-row">
          <h2>Projects</h2>
          <span className="status-pill neutral">Portfolio</span>
        </div>

        <div className="stack-list">
          {projects.map((project) => (
            <div key={project.name} className="stack-item">
              <div>
                <strong>{project.name}</strong>
                <small>{project.owner}</small>
              </div>
              <div className="stack-meta">
                <span className="status-pill neutral">{project.status}</span>
                <small>{project.milestone}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
