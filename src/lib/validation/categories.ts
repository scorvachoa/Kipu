import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().max(16).nullable().optional(),
});