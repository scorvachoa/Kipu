import { requireUserOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  listCategories,
  getCategorySpending,
} from "@/lib/supabase/queries";
import { currentMonthKey } from "@/lib/finance/summary";
import { CategoriesView } from "@/components/categories/categories-view";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await requireUserOrRedirect();
  const supabase = await createClient();
  const monthKey = currentMonthKey();

  const [categories, spending] = await Promise.all([
    listCategories(supabase, user.id),
    getCategorySpending(supabase, user.id, monthKey),
  ]);

  const spendByCategory = new Map<string, Record<string, number>>();
  for (const spend of spending) {
    const totals = spendByCategory.get(spend.category_id) ?? {};
    totals[spend.currency] =
      Math.round(((totals[spend.currency] ?? 0) + spend.total) * 100) / 100;
    spendByCategory.set(spend.category_id, totals);
  }

  return <CategoriesView categories={categories} spendByCategory={spendByCategory} />;
}