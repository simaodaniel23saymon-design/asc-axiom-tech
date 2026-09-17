import type { SessionUser } from "@/lib/auth/session";
import { hasRole, type UserRole } from "@/lib/auth/permissions";

export default function CommandCenterShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const navigation = [
    { label: "Overview", href: "/dashboard", roles: ["admin", "team"] },
    { label: "Goals", href: "/dashboard/goals", roles: ["admin", "team"] },
    { label: "Projects", href: "/dashboard/projects", roles: ["admin", "team"] },
    { label: "Roadmap", href: "/dashboard/roadmap", roles: ["admin", "team"] },
    { label: "Team", href: "/dashboard/team", roles: ["admin", "team"] },
    { label: "Investors", href: "/dashboard/investors", roles: ["admin", "investor"] },
    { label: "Engineering", href: "/dashboard/engineering", roles: ["admin", "team"] },
  ] satisfies { label: string; href: string; roles: readonly UserRole[] }[];

  const visibleNavigation = navigation.filter((item) => hasRole(user, item.roles));

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
          {visibleNavigation.map((item) => (
            <a key={item.href} href={item.href} className="ops-nav-item">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ops-user-card">
          <span className="ops-role">{user.role}</span>
          <strong>{user.name}</strong>
          <small>{user.email}</small>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="ops-logout-link">
              Sign out
            </button>
          </form>
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
