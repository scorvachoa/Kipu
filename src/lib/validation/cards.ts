import { z } from "zod";
import { CARD_TYPES, CURRENCIES } from "@/types/shared";

export const createCardSchema = z.object({
  bank: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(80),
  card_type: z.enum(CARD_TYPES),
  last4: z.string().regex(/^\d{4}$/),
  owner_person_id: z.string().uuid().nullable().optional(),
  currency: z.enum(CURRENCIES).optional(),
  closing_day: z.number().int().min(1).max(31).nullable().optional(),
  payment_day: z.number().int().min(1).max(31).nullable().optional(),
  active: z.boolean().optional(),
});

export const updateCardSchema = createCardSchema.partial().extend({
  last4: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
});