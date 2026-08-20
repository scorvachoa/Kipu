"use client";

import Link from "next/link";
import { ArrowUpRight, Tags } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { DEFAULT_CURRENCY } from "@/types/shared";
import { CategoryIcon } from "@/components/category-icon";
import type { Category } from "@/lib/supabase/queries";
import { Card, CardContent } from "@/components/ui/card";

function pickPrimaryCurrency(spendByCurrency: Record<string, number>): string {
  let best: string = DEFAULT_CURRENCY;
  let bestAmount = -1;
  for (const [currency, amount] of Object.entries(spendByCurrency)) {
    if (
      amount > bestAmount ||
      (amount === bestAmount && currency === DEFAULT_CURRENCY)
    ) {
      best = currency;
      bestAmount = amount;
    }
  }
  return best;
}

export function CategoriesView({
  categories,
  spendByCategory,
}: {
  categories: Category[];
  spendByCategory: Map<string, Record<string, number>>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Categorías</h1>
        <p className="text-sm text-muted-foreground">
          Categorías globales: tus gastos se clasifican automáticamente
        </p>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <Tags className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
            No hay categorías disponibles.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const color = category.color ?? undefined;
            const spendByCurrency = spendByCategory.get(category.id) ?? {};
            const primary = pickPrimaryCurrency(spendByCurrency);
            const spent = spendByCurrency[primary] ?? 0;
            const totalCurrencies = Object.keys(spendByCurrency).length;
            return (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="group flex flex-col gap-2 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40"
              >
                <p className="flex items-center gap-2 text-base font-semibold">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={
                      color ? { backgroundColor: color, color: "#fff" } : undefined
                    }
                  >
                    <CategoryIcon name={category.icon} className="h-4 w-4" />
                  </span>
                  <span className="line-clamp-1">{category.name}</span>
                  <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
                <p className="text-xs text-muted-foreground">
                  {spent > 0
                    ? totalCurrencies > 1
                      ? `Gasto: ${formatMoney(spent, primary)} y ${totalCurrencies - 1} moneda(s) más`
                      : `Gasto: ${formatMoney(spent, primary)}`
                    : "Sin gastos este mes"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}