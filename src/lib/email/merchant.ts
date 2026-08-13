const NOISE_WORDS = new Set(["OP"]);

export function normalizeMerchant(merchant: string | undefined): string | undefined {
  if (!merchant) {
    return undefined;
  }

  const cleaned = merchant
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]*([*])[^A-Z0-9]*/g, " ")
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = cleaned.split(" ").filter((token) => !NOISE_WORDS.has(token));

  return tokens.join(" ");
}

export function merchantMatches(rule: string, normalizedMerchant: string): boolean {
  return normalizedMerchant.includes(rule);
}