import { z } from "zod";

// Valida os parâmetros suportados pela listagem de projectos.
export const projectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["planning", "in_progress", "review", "live", "completed", "blocked"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
});

export type ProjectsQuery = z.infer<typeof projectsQuerySchema>;

// Valida apenas os campos permitidos para a criação de um projecto.
export const projectCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    status: z.enum(["planning", "in_progress", "review", "live", "completed", "blocked"]).default("planning"),
    priority: z.enum(["high", "medium", "low"]).default("medium"),
    progress: z.number().int().min(0).max(100).default(0),
    ownerLabel: z.string().trim().max(200).optional(),
    ownerId: z.uuid().optional(),
    startDate: z
      .string()
      .trim()
      .min(1)
      .refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida.")
      .transform((value) => new Date(value))
      .optional(),
    deadline: z
      .string()
      .trim()
      .min(1)
      .refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida.")
      .transform((value) => new Date(value))
      .optional(),
  })
  .strict();

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

// Valida apenas os campos enviados numa actualização parcial de projecto.
export const projectUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: z.enum(["planning", "in_progress", "review", "live", "completed", "blocked"]).optional(),
    priority: z.enum(["high", "medium", "low"]).optional(),
    progress: z.number().int().min(0).max(100).optional(),
    ownerLabel: z.string().trim().max(200).nullable().optional(),
    ownerId: z.uuid().nullable().optional(),
    startDate: z
      .string()
      .trim()
      .min(1)
      .refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida.")
      .transform((value) => new Date(value))
      .nullable()
      .optional(),
    deadline: z
      .string()
      .trim()
      .min(1)
      .refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida.")
      .transform((value) => new Date(value))
      .nullable()
      .optional(),
  })
  .strict();

export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;