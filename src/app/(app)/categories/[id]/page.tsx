import { notFound } from "next/navigation";
import { requireUserOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getCategorySpending,
  listCategories,
  listTransactions,
} from "@/lib/supabase/queries";
import { currentMonthKey } from "@/lib/finance/summary";
import { CategoryDetailView } from "@/components/categories/category-detail-view";

export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUserOrRedirect();
  const { id } = await params;
  const sp = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const monthKey = first(sp.month) || currentMonthKey();

  const supabase = await createClient();
  const [categories, spending, rows] = await Promise.all([
    listCategories(supabase, user.id),
    getCategorySpending(supabase, user.id, monthKey),
    listTransactions(
      supabase,
      user.id,
      { categoryId: id, monthKey },
      { limit: 500 },
    ),
  ]);

  const category = categories.find((c) => c.id === id);
  if (!category) {
    notFound();
  }

  const spendByCurrency: Record<string, number> = {};
  for (const spend of spending) {
    if (spend.category_id !== id) continue;
    spendByCurrency[spend.currency] =
      Math.round(((spendByCurrency[spend.currency] ?? 0) + spend.total) * 100) /
      100;
  }

  return (
    <CategoryDetailView
      category={category}
      spendByCurrency={spendByCurrency}
      rows={rows}
      monthKey={monthKey}
    />
  );
}