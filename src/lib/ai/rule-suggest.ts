import { generateJSON } from "@/lib/ai/generate-json";
import type { CategoryCandidate } from "@/lib/ai/category-service";
import { normalizeMerchant } from "@/lib/email/merchant";

export interface RuleSuggestion {
  merchant_pattern: string;
  category_id: string;
}

export async function suggestRule(
  merchant: string,
  categories: CategoryCandidate[],
): Promise<RuleSuggestion | null> {
  if (!merchant.trim() || categories.length === 0) {
    return null;
  }

  const normalizedMerchant = normalizeMerchant(merchant);
  if (!normalizedMerchant) {
    return null;
  }

  const list = categories
    .map((candidate) => `${candidate.name} (id: ${candidate.id})`)
    .join(", ");

  const prompt = [
    "Eres un asistente de finanzas personales. Un usuario quiere crear una regla automática de categorización para un comercio.",
    "",
    `Comercio normalizado: "${normalizedMerchant}"`,
    `Categorías disponibles: ${list}`,
    "",
    "Propones un patrón de texto (substring simple, no regex) que coincida con el comercio normalizado, y la categoría más apropiada. El patrón debe ser corto y sin caracteres especiales.",
    "",
    "Responde SOLO en JSON:",
    '{"merchant_pattern": "PATRON", "category_id": "ID_DE_CATEGORIA"}',
  ].join("\n");

  const schema = {
    type: "OBJECT",
    properties: {
      merchant_pattern: { type: "STRING" },
      category_id: { type: "STRING" },
    },
    required: ["merchant_pattern", "category_id"],
  };

  const parsed = await generateJSON<RuleSuggestion>({ prompt, schema });
  if (!parsed) {
    return null;
  }

  if (!categories.some((c) => c.id === parsed.category_id)) {
    const byName = categories.find((c) =>
      c.name.toUpperCase() === (parsed.category_id ?? "").toUpperCase() ||
      (parsed.category_id ?? "").toUpperCase().includes(c.name.toUpperCase()) ||
      c.name.toUpperCase().includes((parsed.category_id ?? "").toUpperCase()),
    );
    if (!byName) {
      return null;
    }
    parsed.category_id = byName.id;
  }

  const cleaned = cleanPattern(parsed.merchant_pattern);
  const candidate = cleaned ? normalizeMerchant(cleaned) : undefined;
  const pattern =
    candidate && normalizedMerchant.includes(candidate)
      ? candidate
      : normalizedMerchant.slice(0, 20);
  return { merchant_pattern: pattern, category_id: parsed.category_id };
}

export function cleanPattern(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const cleaned = value.trim().toUpperCase().replace(/[^A-Z0-9 *]/g, "");
  return cleaned.length > 0 ? cleaned : null;
}