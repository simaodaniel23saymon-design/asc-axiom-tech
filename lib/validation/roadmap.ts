import { z } from "zod";

const roadmapStatuses = ["planned", "in_progress", "review", "completed"] as const;
const roadmapPriorities = ["high", "medium", "low"] as const;

function roadmapDate() {
  return z
    .string()
    .trim()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida.")
    .transform((value) => new Date(value));
}

// Valida os parâmetros suportados pela listagem do roadmap.
export const roadmapQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(roadmapStatuses).optional(),
  priority: z.enum(roadmapPriorities).optional(),
});

// Valida os campos permitidos para criar uma fase do roadmap.
export const roadmapCreateSchema = z
  .object({
    phase: z.string().trim().min(1).max(50),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    status: z.enum(roadmapStatuses).default("planned"),
    priority: z.enum(roadmapPriorities).default("medium"),
    startDate: roadmapDate().nullable().optional(),
    deadline: roadmapDate().nullable().optional(),
  })
  .strict();

// Valida actualizações parciais sem defaults e sem aceitar campos controlados pelo servidor.
export const roadmapUpdateSchema = z
  .object({
    phase: z.string().trim().min(1).max(50).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: z.enum(roadmapStatuses).optional(),
    priority: z.enum(roadmapPriorities).optional(),
    startDate: roadmapDate().nullable().optional(),
    deadline: roadmapDate().nullable().optional(),
  })
  .strict();

export type RoadmapCreateInput = z.infer<typeof roadmapCreateSchema>;
export type RoadmapUpdateInput = z.infer<typeof roadmapUpdateSchema>;