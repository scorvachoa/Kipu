"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  PieChart as PieIcon,
  Wallet,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatMoney, formatDateTime } from "@/lib/format";
import { monthLabel } from "@/lib/finance/summary";
import type { MonthSummary } from "@/lib/finance/summary";
import type { GmailConnectionStatus } from "@/lib/supabase/queries";
import { SyncButton } from "@/components/dashboard/sync-button";
import { DashNarration } from "@/components/dashboard/dashboard-narration";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORY_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
  "#f97316",
  "#3b82f6",
];

export function DashboardView({
  summary,
  gmail,
  monthKey,
  monthOptions,
}: {
  summary: MonthSummary;
  gmail: GmailConnectionStatus;
  monthKey: string;
  monthOptions: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function changeMonth(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", value);
    router.replace(`/dashboard?${params.toString()}`);
  }

  const chartData = summary.categoryBreakdown.slice(0, 8).map((c, i) => ({
    name: c.name,
    value: c.total,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold capitalize">{monthLabel(monthKey)}</h1>
          <p className="text-sm text-muted-foreground">Resumen de tus gastos</p>
        </div>
        <div className="flex items-center gap-2">
          <SyncButton connected={gmail.connected} />
          <Select value={monthKey} onValueChange={changeMonth}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m} value={m} className="capitalize">
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          title="Gastos del mes"
          value={formatMoney(summary.totalExpenses)}
          icon={Wallet}
          hint={`${summary.transactionCount} transacciones`}
        />
        <SummaryCard
          title="Débito"
          value={formatMoney(summary.debitExpenses)}
          icon={ArrowDownLeft}
        />
        <SummaryCard
          title="Crédito"
          value={formatMoney(summary.creditExpenses)}
          icon={ArrowUpRight}
        />
        <SummaryCard
          title="Pagos de tarjetas"
          value={formatMoney(summary.cardPayments)}
          icon={CreditCard}
        />
      </div>

      <DashNarration monthKey={monthKey} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por categoría</CardTitle>
            <CardDescription>Distribución de gastos</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin gastos este mes
              </p>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatMoney(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="w-full space-y-2 text-sm">
                  {summary.categoryBreakdown.map((c, i) => (
                    <li key={c.name} className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                        />
                        <span className="truncate">
                          {c.icon} {c.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatMoney(c.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por tarjeta</CardTitle>
            <CardDescription>Gastos según tarjeta usada</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.cardBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin gastos este mes
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {summary.cardBreakdown.map((c) => (
                  <li key={c.name} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {c.name}
                      {c.last4 ? <span className="text-muted-foreground"> ····{c.last4}</span> : null}
                    </span>
                    <span className="shrink-0 text-muted-foreground">{formatMoney(c.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Movimientos recientes</CardTitle>
            <CardDescription>Últimas transacciones del mes</CardDescription>
          </div>
          <Link href="/transactions" className="text-sm text-primary hover:underline">
            Ver todas
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {summary.latest.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay movimientos. Conecta Gmail y sincroniza.
            </p>
          ) : (
            <ul className="divide-y">
              {summary.latest.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      {t.category?.icon ?? <PieIcon className="h-4 w-4 text-muted-foreground" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate">{t.merchant ?? "Sin descripción"}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.category?.name ?? "Sin categoría"}
                        {t.card?.name ? ` · ${t.card.name}` : ""}
                        {t.person?.name ? ` · ${t.person.name}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {formatDateTime(t.transaction_date, t.transaction_time)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={t.transaction_type === "payment" ? "text-muted-foreground" : ""}>
                      {t.transaction_type === "refund" ||
                      t.transaction_type === "income"
                        ? "+"
                        : "-"}
                      {formatMoney(t.amount, t.currency)}
                    </p>
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      {formatDateTime(t.transaction_date, t.transaction_time)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-lg font-semibold">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}