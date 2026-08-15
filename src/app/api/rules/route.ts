import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listCategories } from "@/lib/supabase/queries";
import { suggestRule } from "@/lib/ai/rule-suggest";
import { createMerchantRule } from "@/lib/supabase/merchant-rule";
import { error, json } from "@/lib/http";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }
  const body = await request.json().catch(() => null);
  const merchant = typeof body?.merchant === "string" ? body.merchant : "";
  const merchantName = merchant.trim();
  if (!merchantName) {
    return error("Falta el comercio", 422);
  }

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