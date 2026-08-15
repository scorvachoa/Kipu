import type { CategoryCandidate, CategoryService } from "./category-service";
import { categorizeManyWithGemini } from "./gemini";

export interface CategoryClassifier {
  classify(
    merchant: string,
    categories: CategoryCandidate[],
  ): Promise<string | null>;
}

const BATCH_SIZE = 8;

export class GeminiCategoryService implements CategoryService, CategoryClassifier {
  private readonly signal: AbortSignal | undefined;

  constructor(options: { signal?: AbortSignal } = {}) {
    this.signal = options.signal;
  }

  async categorize(
    merchant: string,
    categories: CategoryCandidate[],
  ): Promise<string | null> {
    const [result] = await categorizeManyWithGemini([merchant], categories);
    return result ?? null;
  }

  async categorizeMany(
    merchants: string[],
    categories: CategoryCandidate[],
  ): Promise<Array<string | null>> {
    const results: Array<string | null> = [];
    for (let i = 0; i < merchants.length; i += BATCH_SIZE) {
      const chunk = merchants.slice(i, i + BATCH_SIZE);
      results.push(...(await categorizeManyWithGemini(chunk, categories)));
    }
    return results;
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

  async categorizeMany(): Promise<Array<string | null>> {
    return [];
  }
}