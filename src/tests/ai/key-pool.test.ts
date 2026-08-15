import { afterEach, describe, expect, it, vi } from "vitest";

const originalKey = process.env.GOOGLE_AI_API_KEY;
const originalKeys = process.env.GOOGLE_AI_API_KEYS;

function unsetIndexedKeys() {
  for (let i = 1; i < 10; i += 1) {
    delete process.env[`GOOGLE_AI_API_KEY_${i}`];
  }
}

afterEach(() => {
  if (originalKey === undefined) {
    delete process.env.GOOGLE_AI_API_KEY;
  } else {
    process.env.GOOGLE_AI_API_KEY = originalKey;
  }
  if (originalKeys === undefined) {
    delete process.env.GOOGLE_AI_API_KEYS;
  } else {
    process.env.GOOGLE_AI_API_KEYS = originalKeys;
  }
  unsetIndexedKeys();
  vi.resetModules();
});

function createPool() {
  return import("@/lib/ai/key-pool");
}

describe("getApiKeys", () => {
  it("combina GOOGLE_AI_API_KEY con GOOGLE_AI_API_KEYS sin duplicar", async () => {
    process.env.GOOGLE_AI_API_KEY = "key-a";
    process.env.GOOGLE_AI_API_KEYS = "key-b, key-a, key-c";
    const { getApiKeys } = await createPool();
    expect(getApiKeys()).toEqual(["key-a", "key-b", "key-c"]);
  });

  it("usa solo GOOGLE_AI_API_KEYS si no hay key simple", async () => {
    process.env.GOOGLE_AI_API_KEYS = "key-1,key-2";
    const { getApiKeys } = await createPool();
    expect(getApiKeys()).toEqual(["key-1", "key-2"]);
  });

  it("lee keys numeradas GOOGLE_AI_API_KEY_1, _2, ...", async () => {
    process.env.GOOGLE_AI_API_KEY_1 = "numero-1";
    process.env.GOOGLE_AI_API_KEY_2 = "numero-2";
    process.env.GOOGLE_AI_API_KEY_3 = "numero-3";
    const { getApiKeys } = await createPool();
    expect(getApiKeys()).toEqual(["numero-1", "numero-2", "numero-3"]);
  });

  it("combina la key simple con las numeradas", async () => {
    process.env.GOOGLE_AI_API_KEY = "simple";
    process.env.GOOGLE_AI_API_KEY_1 = "numero-1";
    process.env.GOOGLE_AI_API_KEY_2 = "numero-2";
    const { getApiKeys } = await createPool();
    expect(getApiKeys()).toEqual(["simple", "numero-1", "numero-2"]);
  });
});

describe("nextApiKey", () => {
  it("rota en round-robin entre las keys", async () => {
    process.env.GOOGLE_AI_API_KEYS = "k1,k2,k3";
    const { nextApiKey } = await createPool();
    expect([nextApiKey(), nextApiKey(), nextApiKey()]).toEqual(["k1", "k2", "k3"]);
    expect(nextApiKey()).toBe("k1");
  });

  it("salta keys agotadas hasta que todas lo estén", async () => {
    process.env.GOOGLE_AI_API_KEYS = "k1,k2,k3";
    const pool = await createPool();
    pool.markKeyExhausted("k2");
    expect([pool.nextApiKey(), pool.nextApiKey(), pool.nextApiKey()]).toEqual([
      "k1",
      "k3",
      "k1",
    ]);
  });
});

describe("isQuotaError", () => {
  it("reconoce errores 429 y RESOURCE_EXHAUSTED", async () => {
    const { isQuotaError } = await createPool();
    expect(isQuotaError({ status: 429, message: "quota" })).toBe(true);
    expect(isQuotaError({ message: "RESOURCE_EXHAUSTED" })).toBe(true);
    expect(isQuotaError({ message: "some other error" })).toBe(false);
    expect(isQuotaError(null)).toBe(false);
  });
});