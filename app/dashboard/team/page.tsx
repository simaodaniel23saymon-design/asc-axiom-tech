import { teamMembers } from "@/lib/data/ops";

export default function TeamPage() {
  return (
    <div className="ops-page">
      <section className="ops-card">
        <div className="card-header-row">
          <h2>Team</h2>
          <span className="status-pill neutral">Core functions</span>
        </div>

        <div className="team-grid">
          {teamMembers.map((member) => (
            <article key={member.name} className="team-card">
              <div className="avatar">{member.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>
              <strong>{member.name}</strong>
              <span>{member.role}</span>
              <small>{member.focus}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
