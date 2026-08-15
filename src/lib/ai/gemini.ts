import type { CategoryCandidate } from "./category-service";
import { emailProviderOrder } from "./providers";
import { generateJSON } from "./generate-json";

export interface GeminiBatchCategoryResult {
  indice: number;
  category_id: string | null;
}

export async function categorizeManyWithGemini(
  merchants: string[],
  categories: CategoryCandidate[],
): Promise<Array<string | null>> {
  if (merchants.length === 0 || categories.length === 0) {
    return merchants.map(() => null);
  }

  const list = categories
    .map((candidate) => `${candidate.name} (id: ${candidate.id})`)
    .join(", ");

  const numbered = merchants
    .map((merchant, i) => `[${i + 1}] ${merchant}`)
    .join("\n");

  const schema = {
    type: "OBJECT",
    properties: {
      categorias: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            indice: { type: "INTEGER" },
            category_id: { type: "STRING", nullable: true },
          },
          required: ["indice", "category_id"],
        },
      },
    },
    required: ["categorias"],
  };

  const prompt = [
    "Eres un asistente de finanzas personales. Recibes N comercios normalizados y una lista de categorías posibles.",
    "",
    "Cada comercio viene numerado como [N]. Debes asignar a cada uno la categoría más apropiada.",
    "Devuelve SOLO un JSON con un array 'categorias'.",
    "Cada elemento del array debe ser:",
    '  {"indice": N, "category_id": "id_de_la_categoria"}',
    "Si un comercio no encaja en ninguna categoría, usa category_id: null.",
    "Incluye TODOS los comercios (mismo número de elementos que comercios).",
    "",
    `Categorías disponibles: ${list}`,
    "",
    "Comercios:",
    numbered,
  ].join("\n");

  const parsed = await generateJSON<{ categorias?: GeminiBatchCategoryResult[] }>({
    prompt,
    schema,
    providerOrder: emailProviderOrder(),
  });
  if (!parsed?.categorias) {
    return merchants.map(() => null);
  }

  const idsByIndex = new Map<number, string | null>();
  for (const item of parsed.categorias) {
    if (
      typeof item?.indice === "number" &&
      (typeof item.category_id === "string" || item.category_id === null)
    ) {
      idsByIndex.set(item.indice, item.category_id);
    }
  }

  const known = new Set(categories.map((candidate) => candidate.id));

  return merchants.map((_, i) => {
    const id = idsByIndex.get(i + 1) ?? null;
    if (id === null) {
      return null;
    }
    return known.has(id) ? id : null;
  });
}