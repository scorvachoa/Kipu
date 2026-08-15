import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { MerchantRule } from "@/types/categories";

export async function createMerchantRule(
  client: SupabaseClient<Database>,
  userId: string,
  merchantPattern: string,
  categoryId: string,
): Promise<MerchantRule | null> {
  const { data, error } = await client
    .from("merchant_rules")
    .insert({
      user_id: userId,
      merchant_pattern: merchantPattern,
      category_id: categoryId,
      priority: 100,
      active: true,
    } as never)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data as MerchantRule | null;
}