import {
  isQuotaError,
  markKeyExhausted,
  nextApiKey,
} from "./key-pool";
import {
  callGemini,
  callOpenAi,
  isOpenAiQuotaError,
  markOpenAiExhausted,
  nextOpenAiKey,
  providerKeys,
  providerOrder,
  type AiCallParams,
  type AiProvider,
} from "./providers";

export interface GenerateJsonParams {
  prompt: string;
  schema: Record<string, unknown>;
  providerOrder?: AiProvider[];
}

async function callProvider(
  provider: AiProvider,
  apiKey: string,
  params: AiCallParams,
): Promise<string | null> {
  if (provider === "gemini") {
    return callGemini(apiKey, params);
  }
  return callOpenAi(provider, apiKey, params);
}

export async function generateJSON<T>(
  params: GenerateJsonParams,
): Promise<T | null> {
  const order = params.providerOrder ?? providerOrder();
  const providersWithKeys = order.filter(
    (provider) => providerKeys(provider).length > 0,
  );
  if (providersWithKeys.length === 0) {
    return null;
  }

  for (const provider of providersWithKeys) {
    const attempts = providerKeys(provider).length;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const apiKey =
        provider === "gemini"
          ? nextApiKey()
          : nextOpenAiKey(provider);
      if (!apiKey) {
        break;
      }

      try {
        const text = await callProvider(provider, apiKey, params);
        if (!text) {
          return null;
        }
        try {
          return JSON.parse(text) as T;
        } catch {
          return null;
        }
      } catch (error) {
        const quota = isQuotaError(error) || isOpenAiQuotaError(error);
        if (quota) {
          if (provider === "gemini") {
            markKeyExhausted(apiKey);
          } else {
            markOpenAiExhausted(provider, apiKey);
          }
          continue;
        }
        return null;
      }
    }
  }

  return null;
}