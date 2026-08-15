import type { CategoryService } from "@/lib/ai/category-service";
import { GeminiCategoryService } from "@/lib/ai/gemini-category-service";
import { hasEmailAiProvider } from "@/lib/ai/providers";

export function createCategoryService(
  options: { signal?: AbortSignal } = {},
): CategoryService | undefined {
  if (!hasEmailAiProvider()) {
    return undefined;
  }
  return new GeminiCategoryService(options);
}