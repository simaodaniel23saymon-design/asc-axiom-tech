export const runtime = "edge";

export default function UnauthorizedPage() {
  return (
    <div className="ops-page">
      <section className="ops-card">
        <div className="card-header-row">
          <h2>Access denied</h2>
          <span className="status-pill neutral">Restricted</span>
        </div>
        <p className="empty-state">You do not have permission to access this area.</p>
      </section>
    </div>
  );
}