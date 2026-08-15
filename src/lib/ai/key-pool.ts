const EXHAUSTED_TTL_MS = 60 * 60 * 1000;

const exhaustedKeys = new Map<string, number>();
let rotationIndex = 0;

export function getApiKeys(): string[] {
  const keys = new Set<string>();
  const single = process.env.GOOGLE_AI_API_KEY;
  if (single && single.trim()) {
    keys.add(single.trim());
  }
  const multiple = process.env.GOOGLE_AI_API_KEYS;
  if (multiple && multiple.trim()) {
    for (const part of multiple.split(",")) {
      const trimmed = part.trim();
      if (trimmed) {
        keys.add(trimmed);
      }
    }
  }
  for (let i = 1; ; i += 1) {
    const indexed = process.env[`GOOGLE_AI_API_KEY_${i}`];
    if (!indexed || !indexed.trim()) {
      break;
    }
    keys.add(indexed.trim());
  }
  return [...keys];
}

function pruneExhausted(): void {
  const now = Date.now();
  for (const [key, at] of exhaustedKeys) {
    if (now - at > EXHAUSTED_TTL_MS) {
      exhaustedKeys.delete(key);
    }
  }
}

export function isQuotaError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const candidate = error as { status?: number; message?: string };
    if (candidate.status === 429) {
      return true;
    }
    const message = candidate.message ?? "";
    if (/RESOURCE_EXHAUSTED|quota exceeded|429/i.test(message)) {
      return true;
    }
  }
  const text = error instanceof Error ? error.message : String(error);
  return /RESOURCE_EXHAUSTED|quota exceeded|429/i.test(text);
}

export function markKeyExhausted(key: string): void {
  exhaustedKeys.set(key, Date.now());
}

export function nextApiKey(): string | null {
  pruneExhausted();
  const keys = getApiKeys();
  if (keys.length === 0) {
    return null;
  }

  const candidates = keys.filter((key) => !exhaustedKeys.has(key));
  const pool = candidates.length > 0 ? candidates : keys;

  const key = pool[rotationIndex % pool.length];
  rotationIndex += 1;
  return key;
}