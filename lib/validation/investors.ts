import { z } from "zod";

const investorStatusSchema = z.enum([
  "prospect",
  "contacted",
  "meeting",
  "due_diligence",
  "committed",
  "closed",
  "inactive",
]);

const optionalEmail = z
  .string()
  .trim()
  .email("Email inválido.")
  .max(320)
  .nullable()
  .optional();

const optionalDate = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional();

export const investorCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    organization: z.string().trim().max(200).nullable().optional(),
    email: optionalEmail,
    phone: z.string().trim().max(50).nullable().optional(),
    status: investorStatusSchema.default("prospect"),
    notes: z.string().trim().max(2000).nullable().optional(),
    lastContactAt: optionalDate,
    nextFollowUpAt: optionalDate,
  })
  .strict();

export const investorUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    organization: z.string().trim().max(200).nullable().optional(),
    email: optionalEmail,
    phone: z.string().trim().max(50).nullable().optional(),
    status: investorStatusSchema.optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    lastContactAt: optionalDate,
    nextFollowUpAt: optionalDate,
  })
  .strict();

export type InvestorCreateInput = z.infer<typeof investorCreateSchema>;
export type InvestorUpdateInput = z.infer<typeof investorUpdateSchema>;
