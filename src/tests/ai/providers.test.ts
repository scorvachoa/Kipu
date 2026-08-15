import { afterEach, describe, expect, it, vi } from "vitest";

const originalOrder = process.env.AI_PROVIDER_ORDER;
const originalGroqModel = process.env.GROQ_MODEL;
const originalEmailOrder = process.env.EMAIL_AI_PROVIDER_ORDER;
const originalGoogleKey = process.env.GOOGLE_AI_API_KEY;

afterEach(() => {
  for (const env of [
    "GROQ_API_KEY",
    "GROQ_API_KEYS",
    "OPENROUTER_API_KEY",
    "OAUTH2_API_KEY",
  ]) {
    delete process.env[env];
  }
  if (originalOrder === undefined) {
    delete process.env.AI_PROVIDER_ORDER;
  } else {
    process.env.AI_PROVIDER_ORDER = originalOrder;
  }
  if (originalEmailOrder === undefined) {
    delete process.env.EMAIL_AI_PROVIDER_ORDER;
  } else {
    process.env.EMAIL_AI_PROVIDER_ORDER = originalEmailOrder;
  }
  if (originalGoogleKey === undefined) {
    delete process.env.GOOGLE_AI_API_KEY;
  } else {
    process.env.GOOGLE_AI_API_KEY = originalGoogleKey;
  }
  if (originalGroqModel === undefined) {
    delete process.env.GROQ_MODEL;
  } else {
    process.env.GROQ_MODEL = originalGroqModel;
  }
  vi.resetModules();
});

describe("toJsonSchema", () => {
  it("traduce tipos a minúsculas y añade additionalProperties", async () => {
    const { toJsonSchema } = await import("@/lib/ai/providers");
    const schema = toJsonSchema({
      type: "OBJECT",
      properties: {
        nombre: { type: "STRING" },
        cantidad: { type: "INTEGER", nullable: true },
        items: {
          type: "ARRAY",
          items: { type: "OBJECT", properties: { id: { type: "STRING" } } },
        },
      },
      required: ["nombre"],
    });

    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
    expect((schema.properties as Record<string, unknown>).nombre).toEqual({
      type: "string",
    });
    expect(schema.properties).toMatchObject({
      cantidad: { type: ["integer", "null"] },
      items: {
        type: "array",
        items: { type: "object", additionalProperties: false },
      },
    });
  });
});

describe("providerOrder", () => {
  it("usa el orden por defecto sin env", async () => {
    delete process.env.AI_PROVIDER_ORDER;
    const { providerOrder } = await import("@/lib/ai/providers");
    expect(providerOrder()).toEqual(["gemini", "groq", "openrouter"]);
  });

  it("respeta el orden configurado y descarta valores inválidos", async () => {
    process.env.AI_PROVIDER_ORDER = "groq,foo,gemini";
    const { providerOrder } = await import("@/lib/ai/providers");
    expect(providerOrder()).toEqual(["groq", "gemini"]);
  });

  it("vuelve al default si ningún valor es válido", async () => {
    process.env.AI_PROVIDER_ORDER = "foo,bar";
    const { providerOrder } = await import("@/lib/ai/providers");
    expect(providerOrder()).toEqual(["gemini", "groq", "openrouter"]);
  });
});

describe("emailProviderOrder", () => {
  it("por defecto excluye Gemini (solo groq/openrouter)", async () => {
    delete process.env.EMAIL_AI_PROVIDER_ORDER;
    const { emailProviderOrder } = await import("@/lib/ai/providers");
    expect(emailProviderOrder()).toEqual(["groq", "openrouter"]);
    expect(emailProviderOrder()).not.toContain("gemini");
  });

  it("respeta el orden configurado y descarta inválidos", async () => {
    process.env.EMAIL_AI_PROVIDER_ORDER = "openrouter,foo,groq";
    const { emailProviderOrder } = await import("@/lib/ai/providers");
    expect(emailProviderOrder()).toEqual(["openrouter", "groq"]);
  });

  it("vuelve al default si ningún valor es válido", async () => {
    process.env.EMAIL_AI_PROVIDER_ORDER = "foo,bar";
    const { emailProviderOrder } = await import("@/lib/ai/providers");
    expect(emailProviderOrder()).toEqual(["groq", "openrouter"]);
  });
});

describe("readKeys / hasAiProvider", () => {
  it("lee claves indexadas y por comas", async () => {
    process.env.GROQ_API_KEY = "g1";
    process.env.GROQ_API_KEYS = "g2, g3";
    const { readKeys } = await import("@/lib/ai/providers");
    expect(readKeys("GROQ").sort()).toEqual(["g1", "g2", "g3"]);
  });

  it("hasAiProvider es false sin ninguna key", async () => {
    const { hasAiProvider } = await import("@/lib/ai/providers");
    expect(hasAiProvider()).toBe(false);
  });

  it("hasAiProvider es true con una key de groq", async () => {
    process.env.GROQ_API_KEY = "g1";
    const { hasAiProvider } = await import("@/lib/ai/providers");
    expect(hasAiProvider()).toBe(true);
  });

it("hasEmailAiProvider es false con solo Gemini", async () => {
    process.env.GOOGLE_AI_API_KEY = "gem-1";
    const { hasAiProvider, hasEmailAiProvider } = await import(
      "@/lib/ai/providers"
    );
    expect(hasAiProvider()).toBe(true);
    expect(hasEmailAiProvider()).toBe(false);
  });

  it("hasEmailAiProvider es true con clave de groq o openrouter", async () => {
    process.env.GROQ_API_KEY = "g1";
    const { hasEmailAiProvider } = await import("@/lib/ai/providers");
    expect(hasEmailAiProvider()).toBe(true);
  });
});

describe("nextOpenAiKey", () => {
  it("rota y marca agotadas", async () => {
    const {
      nextOpenAiKey,
      markOpenAiExhausted,
    } = await import("@/lib/ai/providers");
    process.env.GROQ_API_KEY = "g1";
    process.env.GROQ_API_KEYS = "g2";

    expect(nextOpenAiKey("groq")).toBe("g1");
    markOpenAiExhausted("groq", "g1");
    expect(nextOpenAiKey("groq")).toBe("g2");
    markOpenAiExhausted("groq", "g2");
    // ambas agotadas: reintenta dentro del pool
    expect(["g1", "g2"]).toContain(nextOpenAiKey("groq"));
  });

  it("devuelve null sin keys", async () => {
    const { nextOpenAiKey } = await import("@/lib/ai/providers");
    expect(nextOpenAiKey("groq")).toBeNull();
  });
});

describe("generateJSON con fallback entre proveedores", () => {
  it("usa Gemini y si agota cuota pasa a Groq", async () => {
    process.env.GOOGLE_AI_API_KEY = "gem-1";
    process.env.GROQ_API_KEY = "g1";
    process.env.AI_PROVIDER_ORDER = "gemini,groq";

    const generateContentSecret = vi
      .fn()
      .mockRejectedValue({ status: 429, message: "quota" });

    vi.doMock("@google/genai", () => ({
      GoogleGenAI: class {
        models = { generateContent: generateContentSecret };
      },
    }));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ hola: "mundo" }) } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("Response", Response);

    const { generateJSON } = await import("@/lib/ai/generate-json");
    const result = await generateJSON<{ hola: string }>({
      prompt: "test",
      schema: { type: "OBJECT", properties: { hola: { type: "STRING" } } },
    });

    expect(generateContentSecret).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("api.groq.com");
    expect(result).toEqual({ hola: "mundo" });
    vi.unstubAllGlobals();
  });

  it("devuelve null si todos fallan por cuota", async () => {
    process.env.GOOGLE_AI_API_KEY = "gem-1";
    process.env.GROQ_API_KEY = "g1";

    const generateContentSecret = vi
      .fn()
      .mockRejectedValue({ status: 429, message: "quota" });
    vi.doMock("@google/genai", () => ({
      GoogleGenAI: class {
        models = { generateContent: generateContentSecret };
      },
    }));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "rate limited",
    });
    vi.stubGlobal("fetch", fetchMock);

    const { generateJSON } = await import("@/lib/ai/generate-json");
    const result = await generateJSON<{ hola: string }>({
      prompt: "test",
      schema: { type: "OBJECT", properties: { hola: { type: "STRING" } } },
    });

    expect(result).toBeNull();
    expect(generateContentSecret).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("usa el orden configurado (groq primero)", async () => {
    process.env.GROQ_API_KEY = "g1";
    process.env.GOOGLE_AI_API_KEY = "gem-1";
    process.env.AI_PROVIDER_ORDER = "groq,gemini";

    const generateContentSecret = vi.fn();
    vi.doMock("@google/genai", () => ({
      GoogleGenAI: class {
        models = { generateContent: generateContentSecret };
      },
    }));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ ok: 1 }) } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { generateJSON } = await import("@/lib/ai/generate-json");
    const result = await generateJSON<{ ok: number }>({
      prompt: "test",
      schema: { type: "OBJECT", properties: { ok: { type: "INTEGER" } } },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(generateContentSecret).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: 1 });
    vi.unstubAllGlobals();
  });
});