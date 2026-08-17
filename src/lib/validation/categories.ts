import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().max(16).nullable().optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    icon: z.string().trim().max(16).nullable().optional(),
    color: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .nullable()
      .optional(),
  })
  .partial();