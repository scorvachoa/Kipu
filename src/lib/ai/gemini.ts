import { GoogleGenAI } from "@google/genai";
import type { CategoryCandidate } from "./category-service";

const DEFAULT_MODEL = "gemini-2.5-flash";

function apiKey(): string | null {
  return process.env.GOOGLE_AI_API_KEY ?? null;
}

function modelName(): string {
  return process.env.GOOGLE_AI_MODEL ?? DEFAULT_MODEL;
}

export interface GeminiCategoryResult {
  category_id: string | null;
}

export async function categorizeWithGemini(
  merchant: string,
  categories: CategoryCandidate[],
  _signal?: AbortSignal,
): Promise<GeminiCategoryResult | null> {
  const key = apiKey();
  if (!key || categories.length === 0) {
    return null;
  }

  const list = categories
    .map((candidate) => `${candidate.name} (id: ${candidate.id})`)
    .join(", ");

  const prompt = [
    "Eres un asistente de finanzas personales. Recibes el nombre de un comercio normalizado y una lista de categorías posibles.",
    "",
    `Comercio: "${merchant}"`,
    `Categorías disponibles: ${list}`,
    "",
    "Devuelve SOLO un JSON con la categoría más apropiada:",
    '{"category_id": "id_de_la_categoria"}',
    "Si ninguna categoría encaja, devuelve:",
    '{"category_id": null}',
  ].join("\n");

  const ai = new GoogleGenAI({ apiKey: key });

  const response = await ai.models.generateContent({
    model: modelName(),
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          category_id: { type: "STRING", nullable: true },
        },
        required: ["category_id"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(text) as GeminiCategoryResult;
    if (typeof parsed.category_id !== "string") {
      return null;
    }
    const known = categories.some(
      (candidate) => candidate.id === parsed.category_id,
    );
    if (!known) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}