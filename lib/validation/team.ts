import { z } from "zod";

export const teamMemberCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    role: z.string().trim().min(1).max(150),
    focus: z.string().trim().max(500).nullable().optional(),
    active: z.boolean().default(true),
  })
  .strict();

export const teamMemberUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    role: z.string().trim().min(1).max(150).optional(),
    focus: z.string().trim().max(500).nullable().optional(),
    active: z.boolean().optional(),
  })
  .strict();

export type TeamMemberCreateInput = z.infer<typeof teamMemberCreateSchema>;
export type TeamMemberUpdateInput = z.infer<typeof teamMemberUpdateSchema>;
