import { afterEach, describe, expect, it, vi } from "vitest";

const originalKey = process.env.GROQ_API_KEY;
const originalKeys = process.env.GROQ_API_KEYS;
const originalEmailOrder = process.env.EMAIL_AI_PROVIDER_ORDER;

afterEach(() => {
  for (const key of [
    "GROQ_API_KEY",
    "GROQ_API_KEYS",
    "OPENROUTER_API_KEY",
    "EMAIL_AI_PROVIDER_ORDER",
  ]) {
    delete process.env[key];
  }
  if (originalKey !== undefined) {
    process.env.GROQ_API_KEY = originalKey;
  }
  if (originalKeys !== undefined) {
    process.env.GROQ_API_KEYS = originalKeys;
  }
  if (originalEmailOrder !== undefined) {
    process.env.EMAIL_AI_PROVIDER_ORDER = originalEmailOrder;
  }
  vi.resetModules();
});

function stubChatCompletion(content: string) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("Response", Response);
  return fetchMock;
}

describe("categorizeManyWithGemini", () => {
  it("agrupa comercios, valida ids conocidos y descarta los que no", async () => {
    process.env.GROQ_API_KEY = "test-key";
    const fetchMock = stubChatCompletion(
      JSON.stringify({
        categorias: [
          { indice: 1, category_id: "cat-a" },
          { indice: 2, category_id: "cat-x" },
          { indice: 3, category_id: null },
        ],
      }),
    );

    const { categorizeManyWithGemini } = await import("@/lib/ai/gemini");

    const result = await categorizeManyWithGemini(
      ["MARKET MARY", "UNSAAC", "OTRO"],
      [
        { id: "cat-a", name: "Alimentación" },
        { id: "cat-b", name: "Transporte" },
      ],
    );

    expect(result).toEqual(["cat-a", null, null]);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("api.groq.com");
    expect(
      JSON.parse(options.body as string).messages[0].content,
    ).toContain("[1] MARKET MARY");
    vi.unstubAllGlobals();
  });

  it("devuelve todo null sin API key de correos", async () => {
    delete process.env.GROQ_API_KEY;
    const { categorizeManyWithGemini } = await import("@/lib/ai/gemini");

    const result = await categorizeManyWithGemini(["MARKET MARY"], [
      { id: "cat-a", name: "Alimentación" },
    ]);

    expect(result).toEqual([null]);
  });

  it("usa el pool de correos configurado (openrouter)", async () => {
    process.env.OPENROUTER_API_KEY = "or-1";
    process.env.EMAIL_AI_PROVIDER_ORDER = "openrouter";
    const fetchMock = stubChatCompletion(
      JSON.stringify({
        categorias: [{ indice: 1, category_id: "cat-a" }],
      }),
    );

    const { categorizeManyWithGemini } = await import("@/lib/ai/gemini");

    const result = await categorizeManyWithGemini(["MARKET MARY"], [
      { id: "cat-a", name: "Alimentación" },
    ]);

    expect(result).toEqual(["cat-a"]);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("openrouter.ai");
    vi.unstubAllGlobals();
  });

  it("mantiene el fallback entre keys (429) dentro del pool", async () => {
    process.env.GROQ_API_KEY = "key-1";
    process.env.GROQ_API_KEYS = "key-2";

    const responses = [
      { ok: false, status: 429, text: async () => "rate limited" },
      {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: JSON.stringify({ categorias: [] }) },
            },
          ],
        }),
      },
    ];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1]);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("Response", Response);

    const { categorizeManyWithGemini } = await import("@/lib/ai/gemini");

    const result = await categorizeManyWithGemini(["MARKET MARY"], [
      { id: "cat-a", name: "Alimentación" },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual([null]);
    vi.unstubAllGlobals();
  });
});