import type { CategoryCandidate, CategoryService } from "./category-service";
import { categorizeWithGemini } from "./gemini";

export interface CategoryClassifier {
  classify(
    merchant: string,
    categories: CategoryCandidate[],
  ): Promise<string | null>;
}

export class GeminiCategoryService implements CategoryService, CategoryClassifier {
  private readonly signal: AbortSignal | undefined;

  constructor(options: { signal?: AbortSignal } = {}) {
    this.signal = options.signal;
  }

  async categorize(
    merchant: string,
    categories: CategoryCandidate[],
  ): Promise<string | null> {
    const result = await categorizeWithGemini(
      merchant,
      categories,
      this.signal,
    );
    return result?.category_id ?? null;
  }

  async classify(
    merchant: string,
    categories: CategoryCandidate[],
  ): Promise<string | null> {
    return this.categorize(merchant, categories);
  }
}

/** Servicio que no invoca IA; útil en tests y cuando la IA está apagada. */
export class NoopCategoryService implements CategoryService {
  async categorize(): Promise<string | null> {
    return null;
  }
}