import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "team",
  "investor",
]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "in_progress",
  "review",
  "live",
  "completed",
  "blocked",
]);

export const priorityEnum = pgEnum("priority", [
  "high",
  "medium",
  "low",
]);

export const goalStatusEnum = pgEnum("goal_status", [
  "not_started",
  "in_progress",
  "on_track",
  "at_risk",
  "completed",
]);

export const roadmapStatusEnum = pgEnum("roadmap_status", [
  "planned",
  "in_progress",
  "review",
  "completed",
]);

export const milestoneStatusEnum = pgEnum("milestone_status", [
  "planned",
  "in_progress",
  "review",
  "completed",
  "blocked",
]);

export const investorStatusEnum = pgEnum("investor_status", [
  "prospect",
  "contacted",
  "meeting",
  "due_diligence",
  "committed",
  "closed",
  "inactive",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("team"),
  status: userStatusEnum("status").notNull().default("active"),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  profileCompleted: boolean("profile_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  focus: text("focus"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("planning"),
  priority: priorityEnum("priority").notNull().default("medium"),
  progress: integer("progress").notNull().default(0),
  ownerLabel: text("owner_label"),
  ownerId: uuid("owner_id").references(() => users.id, {
    onDelete: "set null",
  }),
  startDate: timestamp("start_date", { withTimezone: true }),
  deadline: timestamp("deadline", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  progress: integer("progress").notNull().default(0),
  target: text("target"),
  status: goalStatusEnum("status").notNull().default("not_started"),
  ownerId: uuid("owner_id").references(() => users.id, {
    onDelete: "set null",
  }),
  deadline: timestamp("deadline", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const roadmap = pgTable("roadmap", {
  id: uuid("id").defaultRandom().primaryKey(),
  phase: text("phase").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: roadmapStatusEnum("status").notNull().default("planned"),
  priority: priorityEnum("priority").notNull().default("medium"),
  startDate: timestamp("start_date", { withTimezone: true }),
  deadline: timestamp("deadline", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  roadmapId: uuid("roadmap_id").references(() => roadmap.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  status: milestoneStatusEnum("status").notNull().default("planned"),
  progress: integer("progress").notNull().default(0),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  milestoneId: uuid("milestone_id").references(() => milestones.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  ownerLabel: text("owner_label"),
  ownerId: uuid("owner_id").references(() => users.id, {
    onDelete: "set null",
  }),
  priority: priorityEnum("priority").notNull().default("medium"),
  completed: boolean("completed").notNull().default(false),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const investors = pgTable("investors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  organization: text("organization"),
  email: text("email"),
  phone: text("phone"),
  status: investorStatusEnum("status").notNull().default("prospect"),
  notes: text("notes"),
  lastContactAt: timestamp("last_contact_at", { withTimezone: true }),
  nextFollowUpAt: timestamp("next_follow_up_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  type: text("type").notNull(),
  text: text("text").notNull(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
