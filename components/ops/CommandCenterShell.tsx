import type { SessionUser } from "@/lib/auth/session";

export default function CommandCenterShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const navigation = [
    { label: "Overview", href: "/dashboard" },
    { label: "Goals", href: "/dashboard/goals" },
    { label: "Projects", href: "/dashboard/projects" },
    { label: "Roadmap", href: "/dashboard/roadmap" },
    { label: "Team", href: "/dashboard/team" },
    { label: "Investors", href: "/dashboard/investors" },
    { label: "Engineering", href: "/dashboard/engineering" },
  ];

  return (
    <div className="ops-shell">
      <aside className="ops-sidebar">
        <div className="ops-brand-block">
          <span className="ops-brand-mark">A</span>
          <div>
            <strong>ASC Command</strong>
            <span>Operational system</span>
          </div>
        </div>

        <nav className="ops-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="ops-nav-item">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ops-user-card">
          <span className="ops-role">{user.role}</span>
          <strong>{user.name}</strong>
          <small>{user.email}</small>
          <a href="/api/auth/logout" className="ops-logout-link">
            Sign out
          </a>
        </div>
      </aside>

      <main className="ops-main">
        <header className="ops-topbar">
          <div>
            <span className="eyebrow">ASC Axiom Tech</span>
            <h1>Command Center</h1>
          </div>
          <div className="ops-topbar-status">
            <span className="status-pill live">Operational</span>
            <span className="status-pill neutral">NZoCHAIN focus</span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
