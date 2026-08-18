import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { listCategories } from "@/lib/supabase/queries";
import { suggestRule } from "@/lib/ai/rule-suggest";
import { createMerchantRule } from "@/lib/supabase/merchant-rule";
import { normalizeMerchant } from "@/lib/email/merchant";
import { error, json } from "@/lib/http";
import { rateLimit } from "@/lib/security/rate-limit";

const RULE_WINDOW_MS = 60 * 60 * 1000;
const RULE_MAX_PER_WINDOW = 20;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }

  const limited = rateLimit(`rules:${user.id}`, {
    limit: RULE_MAX_PER_WINDOW,
    windowMs: RULE_WINDOW_MS,
  });
  if (!limited.allowed) {
    return error(
      "Demasiadas solicitudes. Intenta de nuevo en un momento.",
      429,
    );
  }

  const body = await request.json().catch(() => null);
  const merchant = typeof body?.merchant === "string" ? body.merchant : "";
  const merchantName = merchant.trim();
  if (!merchantName) {
    return error("Falta el comercio", 422);
  }
  const transactionId =
    typeof body?.transactionId === "string" ? body.transactionId : null;

  const supabase = await createClient();
  const categories = await listCategories(supabase, user.id);
  if (categories.length === 0) {
    return error("No hay categorías configuradas", 422);
  }

  const suggestion = await suggestRule(
    merchantName,
    categories.map((category) => ({ id: category.id, name: category.name })),
  );

  if (!suggestion) {
    return error("No se pudo sugerir una regla para ese comercio", 502);
  }

  const rule = await createMerchantRule(
    supabase,
    user.id,
    suggestion.merchant_pattern,
    suggestion.category_id,
  );
  if (!rule) {
    return error("No se pudo guardar la regla", 500);
  }

  await applyRuleToTransactions(
    supabase,
    user.id,
    suggestion.merchant_pattern,
    suggestion.category_id,
    transactionId,
  ).catch(() => {});

  const category = categories.find((c) => c.id === suggestion.category_id);
  return json(
    {
      rule,
      merchant_pattern: suggestion.merchant_pattern,
      category_name: category?.name ?? null,
      category_icon: category?.icon ?? null,
    },
    201,
  );
}

async function applyRuleToTransactions(
  supabase: SupabaseClient<Database>,
  userId: string,
  pattern: string,
  categoryId: string,
  transactionId: string | null,
): Promise<void> {
  const normalized = normalizeMerchant(pattern) ?? pattern;

  if (transactionId) {
    await supabase
      .from("transactions")
      .update({ category_id: categoryId, status: "confirmed" })
      .eq("user_id", userId)
      .eq("id", transactionId);
  }

  await supabase
    .from("transactions")
    .update({ category_id: categoryId, status: "confirmed" })
    .eq("user_id", userId)
    .ilike("normalized_merchant", `%${normalized}%`);
}