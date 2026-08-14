import type { CategoryService } from "@/lib/ai/category-service";
import { GeminiCategoryService } from "@/lib/ai/gemini-category-service";

export function createCategoryService(
  options: { signal?: AbortSignal } = {},
): CategoryService | undefined {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key || key.length === 0) {
    return undefined;
  }
  return new GeminiCategoryService(options);
}