"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth/session";
import { hasRole, type UserRole } from "@/lib/auth/permissions";
import LogoutButton from "@/components/ops/LogoutButton";

type NavigationItem = {
  label: string;
  href: string;
  icon: string;
  group: string;
  roles: readonly UserRole[];
};

const navigation: NavigationItem[] = [
  {
    label: "Visão geral",
    href: "/dashboard",
    icon: "fa-chart-line",
    group: "VISÃO GERAL",
    roles: ["admin", "team"],
  },
  {
    label: "Objectivos",
    href: "/dashboard/goals",
    icon: "fa-bullseye",
    group: "PLANEAMENTO",
    roles: ["admin", "team"],
  },
  {
    label: "Projectos",
    href: "/dashboard/projects",
    icon: "fa-folder",
    group: "PLANEAMENTO",
    roles: ["admin", "team"],
  },
  {
    label: "Roadmap",
    href: "/dashboard/roadmap",
    icon: "fa-road",
    group: "PLANEAMENTO",
    roles: ["admin", "team"],
  },
  {
    label: "Equipa",
    href: "/dashboard/team",
    icon: "fa-users",
    group: "ORGANIZAÇÃO",
    roles: ["admin", "team"],
  },
  {
    label: "Investidores",
    href: "/dashboard/investors",
    icon: "fa-handshake",
    group: "ORGANIZAÇÃO",
    roles: ["admin", "investor"],
  },
  {
    label: "Engenharia",
    href: "/dashboard/engineering",
    icon: "fa-code",
    group: "EXECUÇÃO",
    roles: ["admin", "team"],
  },
  {
    label: "Actividades",
    href: "/dashboard/activities",
    icon: "fa-clock-rotate-left",
    group: "EXECUÇÃO",
    roles: ["admin", "team"],
  },
];

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  team: "Equipa",
  investor: "Investidor",
};

export default function CommandCenterShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const visibleNavigation = navigation.filter((item) =>
    hasRole(user, item.roles),
  );

  const currentItem =
    visibleNavigation.find((item) =>
      item.href === "/dashboard"
        ? pathname === item.href
        : pathname.startsWith(item.href),
    ) ?? visibleNavigation[0];

  const groups = Array.from(
    new Set(visibleNavigation.map((item) => item.group)),
  );

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSidebarOpen]);

  return (
    <div className="ops-shell">
      <button
        type="button"
        className="ops-menu-toggle"
        aria-label={isSidebarOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isSidebarOpen}
        aria-controls="ops-sidebar"
        onClick={() => setIsSidebarOpen((open) => !open)}
      >
        <i
          className={
            isSidebarOpen
              ? "fa-solid fa-xmark"
              : "fa-solid fa-bars"
          }
          aria-hidden="true"
        />
      </button>

      {isSidebarOpen ? (
        <button
          type="button"
          className="ops-sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <aside
        id="ops-sidebar"
        className={
          isSidebarOpen
            ? "ops-sidebar is-open"
            : "ops-sidebar"
        }
      >
        <div className="ops-brand-block">
          <span className="ops-brand-mark">
            <img
              src="/axiom-tech-logo.svg"
              alt="ASC Axiom Tech"
            />
          </span>

          <div>
            <strong>ASC Command</strong>
            <span>Operational system</span>
          </div>
        </div>

        <nav
          className="ops-nav"
          aria-label="Navegação principal"
        >
          {groups.map((group) => (
            <div className="ops-nav-group" key={group}>
              <span className="ops-nav-label">{group}</span>

              {visibleNavigation
                .filter((item) => item.group === group)
                .map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        isActive
                          ? "ops-nav-item is-active"
                          : "ops-nav-item"
                      }
                      aria-current={
                        isActive ? "page" : undefined
                      }
                    >
                      <i
                        className={`fa-solid ${item.icon}`}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        <div className="ops-user-card">
          <span className="ops-role">
            {roleLabels[user.role]}
          </span>

          <strong>{user.name}</strong>

          <small>{user.email}</small>

          <Link href="/dashboard/profile" className="ops-profile-link">
            <i className="fa-solid fa-user-pen" aria-hidden="true" />
            <span>Meu perfil</span>
          </Link>

          <LogoutButton />
        </div>
      </aside>

      <main className="ops-main">
        <header className="ops-topbar">
          <div>
            <span className="eyebrow">
              ASC Command · Operational system
            </span>

            <h1>
              {currentItem?.label ?? "Visão geral"}
            </h1>
          </div>

          <div className="ops-topbar-status">
            <span className="status-pill live">
              <i
                className="fa-solid fa-circle"
                aria-hidden="true"
              />
              Operacional
            </span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
