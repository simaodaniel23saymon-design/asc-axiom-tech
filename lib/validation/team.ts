import { z } from "zod";

export const teamMemberCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(320),
    role: z.string().trim().min(1).max(150),
    systemRole: z.enum(["admin", "team", "investor"]).default("team"),
    focus: z.string().trim().max(500).nullable().optional(),
    password: z.string().min(8).max(200),
    active: z.boolean().default(true),
  })
  .strict();

export const teamMemberUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    email: z.string().trim().email().max(320).optional(),
    role: z.string().trim().min(1).max(150).optional(),
    systemRole: z.enum(["admin", "team", "investor"]).optional(),
    focus: z.string().trim().max(500).nullable().optional(),
    active: z.boolean().optional(),
  })
  .strict();

export type TeamMemberCreateInput = z.infer<typeof teamMemberCreateSchema>;
export type TeamMemberUpdateInput = z.infer<typeof teamMemberUpdateSchema>;
