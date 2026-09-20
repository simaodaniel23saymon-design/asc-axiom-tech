import { and, asc, count, desc, eq, gte, lt, ne, or, sql } from "drizzle-orm";
import {
  activities,
  goals,
  investors,
  milestones,
  projects,
  tasks,
  teamMembers,
  users,
} from "@/db/schema";
import type { SessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

const TIMEZONE = "Africa/Luanda";

function startOfTodayInLuanda(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return new Date(`${values.year}-${values.month}-${values.day}T00:00:00+01:00`);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function priorityOrder() {
  return sql`case ${tasks.priority} when 'high' then 1 when 'medium' then 2 when 'low' then 3 else 4 end`;
}

export async function getOverviewData(user: SessionUser) {
  try {
    const db = getDb();
    const generatedAt = new Date();
    const todayStart = startOfTodayInLuanda(generatedAt);
    const tasksWindowEnd = addDays(todayStart, 7);
    const milestonesWindowEnd = addDays(todayStart, 14);

    const openTaskCondition = eq(tasks.completed, false);
    const openMilestoneCondition = ne(milestones.status, "completed");

    const [
      activeProjectsResult,
      blockedProjectsResult,
      goalsOnTrackResult,
      goalsAtRiskResult,
      overdueTasksResult,
      tasksDueNext7DaysResult,
      overdueMilestonesResult,
      milestonesDueNext14DaysResult,
      activeTeamMembersResult,
      projectStatusRows,
      overdueTaskRows,
      upcomingTaskRows,
      atRiskGoalRows,
      criticalMilestoneRows,
      blockedProjectRows,
      recentActivityRows,
      overdueInvestorFollowUpsResult,
      upcomingInvestorFollowUpRows,
    ] = await Promise.all([
      db.select({ total: count() }).from(projects).where(ne(projects.status, "completed")),
      db.select({ total: count() }).from(projects).where(eq(projects.status, "blocked")),
      db.select({ total: count() }).from(goals).where(eq(goals.status, "on_track")),
      db.select({ total: count() }).from(goals).where(eq(goals.status, "at_risk")),
      db
        .select({ total: count() })
        .from(tasks)
        .where(and(openTaskCondition, lt(tasks.dueDate, todayStart))),
      db
        .select({ total: count() })
        .from(tasks)
        .where(and(openTaskCondition, gte(tasks.dueDate, todayStart), lt(tasks.dueDate, tasksWindowEnd))),
      db
        .select({ total: count() })
        .from(milestones)
        .where(and(openMilestoneCondition, lt(milestones.dueDate, todayStart))),
      db
        .select({ total: count() })
        .from(milestones)
        .where(
          and(
            openMilestoneCondition,
            gte(milestones.dueDate, todayStart),
            lt(milestones.dueDate, milestonesWindowEnd),
          ),
        ),
      db.select({ total: count() }).from(teamMembers).where(eq(teamMembers.active, true)),
      db
        .select({ status: projects.status, total: count() })
        .from(projects)
        .groupBy(projects.status),
      db
        .select({
          id: tasks.id,
          title: tasks.title,
          priority: tasks.priority,
          ownerLabel: tasks.ownerLabel,
          dueDate: tasks.dueDate,
          projectId: projects.id,
          projectName: projects.name,
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .where(and(openTaskCondition, lt(tasks.dueDate, todayStart)))
        .orderBy(asc(tasks.dueDate), priorityOrder(), asc(tasks.id))
        .limit(5),
      db
        .select({
          id: tasks.id,
          title: tasks.title,
          priority: tasks.priority,
          ownerLabel: tasks.ownerLabel,
          dueDate: tasks.dueDate,
          projectId: projects.id,
          projectName: projects.name,
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .where(and(openTaskCondition, gte(tasks.dueDate, todayStart), lt(tasks.dueDate, tasksWindowEnd)))
        .orderBy(asc(tasks.dueDate), priorityOrder(), asc(tasks.id))
        .limit(5),
      db
        .select({
          id: goals.id,
          title: goals.title,
          progress: goals.progress,
          target: goals.target,
          status: goals.status,
          deadline: goals.deadline,
        })
        .from(goals)
        .where(eq(goals.status, "at_risk"))
        .orderBy(asc(goals.deadline), asc(goals.id))
        .limit(5),
      db
        .select({
          id: milestones.id,
          title: milestones.title,
          status: milestones.status,
          progress: milestones.progress,
          dueDate: milestones.dueDate,
          projectId: projects.id,
          projectName: projects.name,
        })
        .from(milestones)
        .leftJoin(projects, eq(milestones.projectId, projects.id))
        .where(
          and(
            openMilestoneCondition,
            or(
              lt(milestones.dueDate, todayStart),
              and(gte(milestones.dueDate, todayStart), lt(milestones.dueDate, milestonesWindowEnd)),
            ),
          ),
        )
        .orderBy(asc(milestones.dueDate), asc(milestones.id))
        .limit(5),
      db
        .select({
          id: projects.id,
          name: projects.name,
          status: projects.status,
          progress: projects.progress,
          ownerLabel: projects.ownerLabel,
          deadline: projects.deadline,
        })
        .from(projects)
        .where(eq(projects.status, "blocked"))
        .orderBy(asc(projects.deadline), asc(projects.id))
        .limit(5),
      db
        .select({
          id: activities.id,
          type: activities.type,
          text: activities.text,
          entityType: activities.entityType,
          entityId: activities.entityId,
          createdAt: activities.createdAt,
          actorName: users.name,
        })
        .from(activities)
        .leftJoin(users, eq(activities.userId, users.id))
        .orderBy(desc(activities.createdAt))
        .limit(10),
      db
        .select({ total: count() })
        .from(investors)
        .where(and(lt(investors.nextFollowUpAt, todayStart), ne(investors.status, "inactive"))),
      db
        .select({
          id: investors.id,
          name: investors.name,
          organization: investors.organization,
          status: investors.status,
          nextFollowUpAt: investors.nextFollowUpAt,
        })
        .from(investors)
        .where(
          and(
            gte(investors.nextFollowUpAt, todayStart),
            lt(investors.nextFollowUpAt, tasksWindowEnd),
            ne(investors.status, "inactive"),
          ),
        )
        .orderBy(asc(investors.nextFollowUpAt), asc(investors.id))
        .limit(5),
    ]);

    const projectStatus = {
      planning: 0,
      inProgress: 0,
      review: 0,
      live: 0,
      blocked: 0,
      completed: 0,
    };

    for (const row of projectStatusRows) {
      if (row.status === "planning") projectStatus.planning = row.total;
      if (row.status === "in_progress") projectStatus.inProgress = row.total;
      if (row.status === "review") projectStatus.review = row.total;
      if (row.status === "live") projectStatus.live = row.total;
      if (row.status === "blocked") projectStatus.blocked = row.total;
      if (row.status === "completed") projectStatus.completed = row.total;
    }

    const mapTask = (task: (typeof overdueTaskRows)[number]) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      ownerLabel: task.ownerLabel,
      dueDate: task.dueDate,
      project: task.projectId && task.projectName ? { id: task.projectId, name: task.projectName } : null,
    });

    const response = {
      generatedAt: generatedAt.toISOString(),
      timezone: TIMEZONE,
      kpis: {
        activeProjects: activeProjectsResult[0]?.total ?? 0,
        blockedProjects: blockedProjectsResult[0]?.total ?? 0,
        goalsOnTrack: goalsOnTrackResult[0]?.total ?? 0,
        goalsAtRisk: goalsAtRiskResult[0]?.total ?? 0,
        overdueTasks: overdueTasksResult[0]?.total ?? 0,
        tasksDueNext7Days: tasksDueNext7DaysResult[0]?.total ?? 0,
        overdueMilestones: overdueMilestonesResult[0]?.total ?? 0,
        milestonesDueNext14Days: milestonesDueNext14DaysResult[0]?.total ?? 0,
        activeTeamMembers: activeTeamMembersResult[0]?.total ?? 0,
      },
      projectStatus,
      lists: {
        overdueTasks: overdueTaskRows.map(mapTask),
        upcomingTasks: upcomingTaskRows.map(mapTask),
        atRiskGoals: atRiskGoalRows,
        criticalMilestones: criticalMilestoneRows.map((milestone) => ({
          id: milestone.id,
          title: milestone.title,
          status: milestone.status,
          progress: milestone.progress,
          dueDate: milestone.dueDate,
          project:
            milestone.projectId && milestone.projectName
              ? { id: milestone.projectId, name: milestone.projectName }
              : null,
        })),
        recentActivities: recentActivityRows,
        blockedProjects: blockedProjectRows,
      },
      ...(user.role === "admin"
        ? {
            admin: {
              overdueInvestorFollowUps: overdueInvestorFollowUpsResult[0]?.total ?? 0,
              upcomingInvestorFollowUps: upcomingInvestorFollowUpRows,
            },
          }
        : {}),
    };

    return response;
  } catch (error) {
    console.error("[ops/overview] Falha ao consultar dados da Overview.", error);
    throw error;
  }
}
