import { generateJSON } from "@/lib/ai/generate-json";

export interface MerchantEnrichment {
  merchant: string;
  readable_name: string | null;
  category: string | null;
}

export async function enrichMerchant(
  merchant: string,
  knownCategories: { name: string }[],
  knownMerchants: { name: string; category?: string | null }[],
): Promise<MerchantEnrichment | null> {
  if (!merchant.trim()) {
    return null;
  }

  const categoriesText = knownCategories.map((c) => c.name).join(", ");
  const context: string[] = []; 
  const similar = knownMerchants
    .filter(
      (known) =>
        known.name &&
        merchant.toLowerCase().includes(known.name.toLowerCase()),
    )
    .slice(0, 5);
  if (similar.length > 0) {
    context.push(
      `Clasificaciones previas similares: ${similar
        .map((s) => `${s.name} → ${s.category ?? "sin categoría"}`)
        .join("; ")}`,
    );
  }

  const prompt = [
    "Eres el asistente de Kipu. Recibes el texto crudo de un comercio aparecido en un estado de cuenta bancario.",
    "",
    `Comercio crudo: "${merchant}"`,
    `Categorías disponibles: ${categoriesText || "ninguna"}`,
    ...(context.length > 0 ? context : []),
    "",
    "Responde SOLO con JSON. Da un nombre legible (normaliza acrónimos, capitaliza, quita ruido bancario) y la categoría más probable de la lista. Si no puedes determinar categoría, usa null.",
    '{"readable_name": "NOMBRE_LEGIBLE", "category": "CATEGORIA_O_NULL"}',
    "",
    "No uses markdown ni caracteres especiales en readable_name.",
  ].join("\n");

  const schema = {
    type: "OBJECT",
    properties: {
      readable_name: { type: "STRING" },
      category: { type: "STRING" },
    },
    required: ["readable_name", "category"],
  };

  const parsed = await generateJSON<{
    readable_name: string;
    category: string | null;
  }>({ prompt, schema });
  if (!parsed) {
    return null;
  }

  const readable = cleanReadableName(parsed.readable_name);
  const category =
    parsed.category && categoriesText.includes(parsed.category)
      ? parsed.category
      : null;
  return { merchant, readable_name: readable, category };
}

export function cleanReadableName(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const cleaned = value
    .replace(/\b(?:PEN|SOLES|MN|USD)\b.*$/i, "")
    .replace(/\bS\/.*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["']|["']$/g, "");
  return cleaned.length > 0 ? cleaned : null;
}