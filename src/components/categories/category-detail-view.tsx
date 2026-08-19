"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  cardNameWithLast4,
  formatDateTime,
  formatMoney,
  monthOptions,
} from "@/lib/format";
import { monthLabel } from "@/lib/finance/summary";
import { DEFAULT_CURRENCY } from "@/types/shared";
import { CategoryIcon } from "@/components/category-icon";
import type { Category } from "@/lib/supabase/queries";
import type { SummaryTx } from "@/lib/finance/summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export function CategoryDetailView({
  category,
  spendByCurrency,
  rows,
  monthKey,
}: {
  category: Category;
  spendByCurrency: Record<string, number>;
  rows: SummaryTx[];
  monthKey: string;
}) {
  const router = useRouter();
  const color = category.color ?? undefined;
  const primary = pickPrimaryCurrency(spendByCurrency);
  const spent = spendByCurrency[primary] ?? 0;
  const budget = category.monthly_budget;
  const comparable = budget !== null && budget >= 0 && primary === DEFAULT_CURRENCY;
  const percent = comparable
    ? Math.min(100, Math.round((spent / budget!) * 100))
    : 0;
  const overBudget = comparable && spent > budget!;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/categories"
            className="mb-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Categorías
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={color ? { backgroundColor: color, color: "#fff" } : undefined}
            >
              <CategoryIcon name={category.icon} className="h-5 w-5" />
            </span>
            {category.name}
          </h1>
        </div>
        <Select
          value={monthKey}
          onValueChange={(m) =>
            router.replace(`/categories/${category.id}?month=${m}`)
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions().map((m) => (
              <SelectItem key={m} value={m}>
                {monthLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total del mes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <p className="text-2xl font-semibold">
            {spent > 0
              ? formatMoney(spent, primary)
              : "Sin consumos este mes"}
          </p>
          {Object.keys(spendByCurrency).length > 1
            ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {Object.entries(spendByCurrency)
                  .filter(([c]) => c !== primary)
                  .map(([c, a]) => `${formatMoney(a, c)} en ${c}`)
                  .join(" · ")}
              </p>
            )
            : null}
          {budget !== null ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Presupuesto mensual</span>
                <span className={overBudget ? "font-medium text-red-600" : "text-muted-foreground"}>
                  {formatMoney(budget, DEFAULT_CURRENCY)}
                </span>
              </div>
              {comparable && budget > 0 ? (
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      overBudget ? "bg-red-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No hay movimientos en este mes.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Comercio</TableHead>
                  <TableHead>Tarjeta</TableHead>
                  <TableHead>Persona</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(t.transaction_date, t.transaction_time)}
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-1 max-w-[220px]">
                        {t.merchant ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {t.cards
                        ? cardNameWithLast4(t.cards.name, t.cards.last4)
                        : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {t.people?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {t.transaction_type === "payment" ? (
                        <Badge variant="secondary" className="mr-1">
                          Pago
                        </Badge>
                      ) : null}
                      {t.transaction_type === "income" ? (
                        <Badge variant="secondary" className="mr-1">
                          Ingreso
                        </Badge>
                      ) : null}
                      <span
                        className={
                          t.transaction_type === "refund" ||
                          t.transaction_type === "income"
                            ? "text-emerald-600"
                            : ""
                        }
                      >
                        {t.transaction_type === "refund" ||
                        t.transaction_type === "income"
                          ? "+"
                          : "-"}
                        {formatMoney(t.amount, t.currency)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}