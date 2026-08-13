import type { MerchantRule } from "@/types/categories";

export function classifyByRules(
  rules: MerchantRule[],
  normalizedMerchant: string | undefined,
): string | null {
  if (!normalizedMerchant) {
    return null;
  }

  const active = rules
    .filter((rule) => rule.active)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of active) {
    if (normalizedMerchant.includes(rule.merchant_pattern)) {
      return rule.category_id;
    }
  }

  return null;
}