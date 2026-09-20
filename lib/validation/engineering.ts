import { z } from "zod";

const projectStatusSchema = z.enum([
  "planning",
  "in_progress",
  "review",
  "live",
  "completed",
  "blocked",
]);

const milestoneStatusSchema = z.enum([
  "planned",
  "in_progress",
  "review",
  "completed",
  "blocked",
]);

const prioritySchema = z.enum([
  "high",
  "medium",
  "low",
]);

const optionalDate = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value))
  .nullable()
  .optional();

const optionalUuid = z
  .string()
  .uuid()
  .nullable()
  .optional();

export const engineeringProjectCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    status: projectStatusSchema.default("planning"),
    priority: prioritySchema.default("medium"),
    progress: z.number().int().min(0).max(100).default(0),
    ownerLabel: z.string().trim().max(200).nullable().optional(),
    ownerId: optionalUuid,
    startDate: optionalDate,
    deadline: optionalDate,
  })
  .strict();

export const engineeringProjectUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: projectStatusSchema.optional(),
    priority: prioritySchema.optional(),
    progress: z.number().int().min(0).max(100).optional(),
    ownerLabel: z.string().trim().max(200).nullable().optional(),
    ownerId: optionalUuid,
    startDate: optionalDate,
    deadline: optionalDate,
  })
  .strict();

export const engineeringMilestoneCreateSchema = z
  .object({
    projectId: optionalUuid,
    roadmapId: optionalUuid,
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    status: milestoneStatusSchema.default("planned"),
    progress: z.number().int().min(0).max(100).default(0),
    dueDate: optionalDate,
  })
  .strict();

export const engineeringMilestoneUpdateSchema = z
  .object({
    projectId: optionalUuid,
    roadmapId: optionalUuid,
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: milestoneStatusSchema.optional(),
    progress: z.number().int().min(0).max(100).optional(),
    dueDate: optionalDate,
  })
  .strict();

export const engineeringTaskCreateSchema = z
  .object({
    projectId: optionalUuid,
    milestoneId: optionalUuid,
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    ownerLabel: z.string().trim().max(200).nullable().optional(),
    ownerId: optionalUuid,
    priority: prioritySchema.default("medium"),
    completed: z.boolean().default(false),
    dueDate: optionalDate,
  })
  .strict();

export const engineeringTaskUpdateSchema = z
  .object({
    projectId: optionalUuid,
    milestoneId: optionalUuid,
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    ownerLabel: z.string().trim().max(200).nullable().optional(),
    ownerId: optionalUuid,
    priority: prioritySchema.optional(),
    completed: z.boolean().optional(),
    dueDate: optionalDate,
  })
  .strict();

export type EngineeringProjectCreateInput = z.infer<
  typeof engineeringProjectCreateSchema
>;

export type EngineeringProjectUpdateInput = z.infer<
  typeof engineeringProjectUpdateSchema
>;

export type EngineeringMilestoneCreateInput = z.infer<
  typeof engineeringMilestoneCreateSchema
>;

export type EngineeringMilestoneUpdateInput = z.infer<
  typeof engineeringMilestoneUpdateSchema
>;

export type EngineeringTaskCreateInput = z.infer<
  typeof engineeringTaskCreateSchema
>;

export type EngineeringTaskUpdateInput = z.infer<
  typeof engineeringTaskUpdateSchema
>;
