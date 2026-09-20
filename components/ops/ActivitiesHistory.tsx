"use client";

import { useCallback, useEffect, useState } from "react";

type Activity = {
  id: string;
  type: string;
  text: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "team" | "investor";
  } | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ApiResponse = {
  data: Activity[];
  pagination: Pagination;
};

const FILTERS = [
  { label: "Todas", value: "" },
  { label: "Projectos", value: "project" },
  { label: "Objectivos", value: "goal" },
  { label: "Roadmap", value: "roadmap" },
  { label: "Equipa", value: "team_member" },
  { label: "Investidores", value: "investor" },
  { label: "Engenharia", value: "engineering" },
] as const;

function formatActivityType(type: string) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatEntityType(entityType: string | null) {
  if (!entityType) return "Sistema";

  const labels: Record<string, string> = {
    project: "Projecto",
    goal: "Objectivo",
    roadmap: "Roadmap",
    team_member: "Equipa",
    investor: "Investidor",
    milestone: "Engenharia",
    task: "Engenharia",
  };

  return labels[entityType] ?? entityType;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getActivityHref(activity: Activity) {
  if (activity.entityType === "project") {
    return "/dashboard/projects";
  }

  if (activity.entityType === "goal") {
    return "/dashboard/goals";
  }

  if (activity.entityType === "roadmap") {
    return "/dashboard/roadmap";
  }

  if (activity.entityType === "team_member") {
    return "/dashboard/team";
  }

  if (activity.entityType === "investor") {
    return "/dashboard/investors";
  }

  if (
    activity.entityType === "milestone" ||
    activity.entityType === "task"
  ) {
    return "/dashboard/engineering";
  }

  return null;
}

export default function ActivitiesHistory() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
      });

      if (filter) {
        params.set("entityType", filter);
      }

      const response = await fetch(
        `/api/ops/activities?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };

        throw new Error(
          payload.error ?? "Não foi possível carregar o histórico.",
        );
      }

      const payload = (await response.json()) as ApiResponse;

      setActivities(payload.data);
      setPagination(payload.pagination);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar o histórico.",
      );
      setActivities([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  function handleFilterChange(value: string) {
    setFilter(value);
    setPage(1);
  }

  return (
    <section className="ops-section">
      <div className="ops-section-header">
        <div>
          <span className="eyebrow">Audit trail</span>
          <h2>Activities / Histórico</h2>
          <p>
            Registo das operações realizadas no Command Center.
          </p>
        </div>

        <button
          type="button"
          className="ops-button"
          onClick={() => void loadActivities()}
          disabled={loading}
        >
          {loading ? "A carregar..." : "Actualizar"}
        </button>
      </div>

      <div className="ops-filter-row" aria-label="Filtrar actividades">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`ops-filter-button ${
              filter === item.value ? "active" : ""
            }`}
            onClick={() => handleFilterChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="ops-empty-state">
          <strong>Não foi possível carregar o histórico.</strong>
          <p>{error}</p>

          <button
            type="button"
            className="ops-button"
            onClick={() => void loadActivities()}
          >
            Tentar novamente
          </button>
        </div>
      ) : loading ? (
        <div className="ops-empty-state">
          <p>A carregar actividades...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="ops-empty-state">
          <strong>Nenhuma actividade encontrada.</strong>
          <p>
            Ainda não existem registos para o filtro seleccionado.
          </p>
        </div>
      ) : (
        <div className="ops-activity-list">
          {activities.map((activity) => {
            const href = getActivityHref(activity);

            return (
              <article key={activity.id} className="ops-activity-item">
                <div
                  className={`ops-activity-marker ${
                    activity.entityType ?? "system"
                  }`}
                  aria-hidden="true"
                />

                <div className="ops-activity-content">
                  <div className="ops-activity-topline">
                    <div className="ops-activity-category">
                      <span className="status-pill neutral">
                        {formatEntityType(activity.entityType)}
                      </span>

                      <span className="ops-activity-type">
                        {formatActivityType(activity.type)}
                      </span>
                    </div>

                    <time
                      className="ops-activity-date"
                      dateTime={activity.createdAt}
                    >
                      {formatDate(activity.createdAt)}
                    </time>
                  </div>

                  <h3>{activity.text}</h3>

                  <div className="ops-activity-meta">
                    <span>
                      <strong>Por</strong>
                      <span>{activity.actor?.name ?? "Sistema"}</span>
                    </span>

                    {activity.actor?.role ? (
                      <span>
                        <strong>Perfil</strong>
                        <span>
                          {activity.actor.role === "admin"
                            ? "Administrador"
                            : activity.actor.role === "team"
                              ? "Equipa"
                              : "Investidor"}
                        </span>
                      </span>
                    ) : null}
                  </div>

                  {href ? (
                    <a href={href} className="ops-activity-link">
                      Ver área
                      <span aria-hidden="true">→</span>
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 0 ? (
        <div className="ops-pagination">
          <span>
            Página {pagination.page} de {pagination.totalPages} ·{" "}
            {pagination.total} registos
          </span>

          <div className="ops-pagination-actions">
            <button
              type="button"
              className="ops-button"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() =>
                setPage((current) => Math.max(1, current - 1))
              }
            >
              ← Anterior
            </button>

            <button
              type="button"
              className="ops-button"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima →
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
