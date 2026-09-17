import { z } from "zod";

const goalStatuses = ["not_started", "in_progress", "on_track", "at_risk", "completed"] as const;

function goalDate() {
  return z
    .string()
    .trim()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida.")
    .transform((value) => new Date(value));
}

// Valida os parâmetros suportados pela listagem de objectivos.
export const goalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(goalStatuses).optional(),
});

// Valida apenas os campos permitidos para a criação de um objectivo.
export const goalCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    progress: z.number().int().min(0).max(100).default(0),
    target: z.string().trim().max(500).nullable().optional(),
    status: z.enum(goalStatuses).default("not_started"),
    ownerId: z.uuid().nullable().optional(),
    deadline: goalDate().nullable().optional(),
  })
  .strict();

// Valida actualizações parciais sem aplicar defaults nem aceitar campos controlados pelo servidor.
export const goalUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    progress: z.number().int().min(0).max(100).optional(),
    target: z.string().trim().max(500).nullable().optional(),
    status: z.enum(goalStatuses).optional(),
    ownerId: z.uuid().nullable().optional(),
    deadline: goalDate().nullable().optional(),
  })
  .strict();

export type GoalCreateInput = z.infer<typeof goalCreateSchema>;
export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>;