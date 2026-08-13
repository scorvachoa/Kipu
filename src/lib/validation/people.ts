import { z } from "zod";

export const createPersonSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(["family", "other"]).optional(),
});