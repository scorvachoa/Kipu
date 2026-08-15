import { GoogleGenAI } from "@google/genai";

export type AiProvider = "gemini" | "groq" | "openrouter";

export const PROVIDER_IDS: AiProvider[] = ["gemini", "groq", "openrouter"];

export interface AiCallParams {
  prompt: string;
  schema: Record<string, unknown>;
}

const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";

export function geminiModelName(): string {
  return process.env.GOOGLE_AI_MODEL ?? GEMINI_DEFAULT_MODEL;
}

interface OpenAiProviderConfig {
  baseUrl: string;
  model: string;
}

const OPENAI_PROVIDERS: Record<"groq" | "openrouter", OpenAiProviderConfig> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    model: process.env.OPENROUTER_MODEL ?? "google/gemma-4-26b-a4b-it:free",
  },
};

const PROVIDER_ENV_PREFIX: Record<AiProvider, string> = {
  gemini: "GOOGLE_AI",
  groq: "GROQ",
  openrouter: "OPENROUTER",
};

export function readKeys(prefix: string): string[] {
  const keys = new Set<string>();
  const single = process.env[`${prefix}_API_KEY`];
  if (single && single.trim()) {
    keys.add(single.trim());
  }
  const multiple = process.env[`${prefix}_API_KEYS`];
  if (multiple && multiple.trim()) {
    for (const part of multiple.split(",")) {
      const trimmed = part.trim();
      if (trimmed) {
        keys.add(trimmed);
      }
    }
  }
  for (let i = 1; ; i += 1) {
    const indexed = process.env[`${prefix}_API_KEY_${i}`];
    if (!indexed || !indexed.trim()) {
      break;
    }
    keys.add(indexed.trim());
  }
  return [...keys];
}

export function providerKeys(provider: AiProvider): string[] {
  return readKeys(PROVIDER_ENV_PREFIX[provider]);
}

export function hasAiProvider(): boolean {
  return providerOrder().some((provider) => providerKeys(provider).length > 0);
}

export function providerOrder(): AiProvider[] {
  const raw = process.env.AI_PROVIDER_ORDER;
  if (!raw) {
    return [...PROVIDER_IDS];
  }
  const valid = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is AiProvider =>
      (PROVIDER_IDS as string[]).includes(part),
    );
  if (valid.length > 0) {
    return valid;
  }
  return [...PROVIDER_IDS];
}

const EMAIL_DEFAULT_PROVIDERS: AiProvider[] = ["groq", "openrouter"];

export function emailProviderOrder(): AiProvider[] {
  const raw = process.env.EMAIL_AI_PROVIDER_ORDER;
  if (!raw) {
    return [...EMAIL_DEFAULT_PROVIDERS];
  }
  const valid = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is AiProvider =>
      (PROVIDER_IDS as string[]).includes(part),
    );
  if (valid.length > 0) {
    return valid;
  }
  return [...EMAIL_DEFAULT_PROVIDERS];
}

export function hasEmailAiProvider(): boolean {
  return emailProviderOrder().some(
    (provider) => providerKeys(provider).length > 0,
  );
}

const EXHAUSTED_TTL_MS = 60 * 60 * 1000;

const exhaustedKeys = new Map<string, number>();
const rotationIndex = new Map<string, number>();

function exhaustionKey(provider: AiProvider, apiKey: string): string {
  return `${provider}:${apiKey}`;
}

function pruneExhausted(provider: AiProvider): void {
  const now = Date.now();
  for (const [entryKey, at] of exhaustedKeys) {
    if (entryKey.startsWith(`${provider}:`) && now - at > EXHAUSTED_TTL_MS) {
      exhaustedKeys.delete(entryKey);
    }
  }
}

function markExhausted(provider: AiProvider, apiKey: string): void {
  exhaustedKeys.set(exhaustionKey(provider, apiKey), Date.now());
}

export function nextOpenAiKey(
  provider: "groq" | "openrouter",
): string | null {
  pruneExhausted(provider);
  const keys = providerKeys(provider);
  if (keys.length === 0) {
    return null;
  }
  const active = keys.filter(
    (key) => !exhaustedKeys.has(exhaustionKey(provider, key)),
  );
  const pool = active.length > 0 ? active : keys;
  const index = rotationIndex.get(provider) ?? 0;
  rotationIndex.set(provider, index + 1);
  return pool[index % pool.length];
}

export async function callGemini(
  apiKey: string,
  params: AiCallParams,
): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: geminiModelName(),
    contents: params.prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: params.schema,
    },
  });
  return response.text ?? null;
}

export async function callOpenAi(
  provider: "groq" | "openrouter",
  apiKey: string,
  params: AiCallParams,
): Promise<string | null> {
  const config = OPENAI_PROVIDERS[provider];
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(provider === "openrouter"
        ? {
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "",
            "X-Title": "Kipu",
          }
        : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: params.prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "response",
          schema: toJsonSchema(params.schema),
          strict: false,
        },
      },
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    throw new ProviderHttpError(response.status, await response.text());
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return body.choices?.[0]?.message?.content ?? null;
}

export class ProviderHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ProviderHttpError";
    this.status = status;
  }
}

export function isOpenAiQuotaError(error: unknown): boolean {
  if (!(error instanceof ProviderHttpError)) {
    return false;
  }
  return error.status === 429 || error.status === 402;
}

export function markOpenAiExhausted(
  provider: "groq" | "openrouter",
  apiKey: string,
): void {
  markExhausted(provider, apiKey);
}

type JsonSchemaNode = Record<string, unknown>;

export function toJsonSchema(schema: JsonSchemaNode): JsonSchemaNode {
  const result: JsonSchemaNode = { ...schema };

  if (result.properties && typeof result.properties === "object") {
    const properties: JsonSchemaNode = {};
    for (const [key, value] of Object.entries(
      result.properties as Record<string, unknown>,
    )) {
      properties[key] = toJsonSchema(value as JsonSchemaNode);
    }
    result.properties = properties;
    result.additionalProperties = false;
  }

  if (result.items && typeof result.items === "object") {
    result.items = toJsonSchema(result.items as JsonSchemaNode);
  }

  if (typeof result.type === "string") {
    const type = String(result.type).toLowerCase();
    const mapped: Record<string, string> = {
      string: "string",
      integer: "integer",
      number: "number",
      boolean: "boolean",
      object: "object",
      array: "array",
    };
    result.type = mapped[type] ?? type;
  }

  if (result.nullable === true) {
    if (Array.isArray(result.type)) {
      (result.type as string[]).push("null");
    } else if (typeof result.type === "string") {
      result.type = [result.type, "null"];
    }
    delete result.nullable;
  }

  return result;
}

export interface ProviderCallResult {
  provider: AiProvider;
  text: string | null;
}