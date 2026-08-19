"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  TrendingUp,
  Wallet,
  PiggyBank,
  Scale,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  formatMoney,
  formatMoneyMany,
  formatDateTime,
  cardNameWithLast4,
  monthShortLabel,
} from "@/lib/format";
import { monthLabel } from "@/lib/finance/summary";
import type { MonthSummary, MonthlyTrendPoint } from "@/lib/finance/summary";
import type { GmailConnectionStatus } from "@/lib/supabase/queries";
import { SyncButton } from "@/components/dashboard/sync-button";
import { DashNarration } from "@/components/dashboard/dashboard-narration";
import { CategoryIcon } from "@/components/category-icon";
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

const SUMMARY_ACCENTS = [
  {
    iconBg: "bg-indigo-500/10",
    iconText: "text-indigo-600 dark:text-indigo-400",
  },
  {
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-600 dark:text-emerald-400",
  },
  {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-400",
  },
  {
    iconBg: "bg-sky-500/10",
    iconText: "text-sky-600 dark:text-sky-400",
  },
  {
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-600 dark:text-rose-400",
  },
  {
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-600 dark:text-teal-400",
  },
];

export function DashboardView({
  summary,
  trend,
  gmail,
  monthKey,
  monthOptions,
}: {
  summary: MonthSummary;
  trend: MonthlyTrendPoint[];
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
    currency: c.currency,
    color: c.color ?? CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const trendData = trend.map((point) => ({
    label: monthShortLabel(point.monthKey),
    total: point.total,
    currency: point.currency,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold capitalize">{monthLabel(monthKey)}</h1>
          <p className="text-sm text-muted-foreground">
            Resumen de tus gastos{presenteMultiCurrency(summary) ? " (por moneda)" : ""}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="flex-1 sm:flex-none">
            <SyncButton connected={gmail.connected} />
          </div>
          <Select value={monthKey} onValueChange={changeMonth}>
            <SelectTrigger className="w-full sm:w-[170px]">
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <SummaryCard
          title="Gastos del mes"
          value={formatMoneyMany(summary.totalExpensesByCurrency, summary.baseCurrency)}
          icon={Wallet}
          hint={`${summary.transactionCount} transacciones`}
          accent={SUMMARY_ACCENTS[0]}
        />
        <SummaryCard
          title="Ingresos del mes"
          value={formatMoneyMany(summary.totalIncomeByCurrency, summary.baseCurrency)}
          icon={PiggyBank}
          accent={SUMMARY_ACCENTS[1]}
        />
        <SummaryCard
          title="Saldo neto"
          value={formatMoney(summary.netBalance, summary.baseCurrency)}
          icon={Scale}
          accent={SUMMARY_ACCENTS[2]}
        />
        <SummaryCard
          title="Débito"
          value={formatMoneyMany(summary.debitExpensesByCurrency, summary.baseCurrency)}
          icon={ArrowDownLeft}
          accent={SUMMARY_ACCENTS[3]}
        />
        <SummaryCard
          title="Crédito"
          value={formatMoneyMany(summary.creditExpensesByCurrency, summary.baseCurrency)}
          icon={ArrowUpRight}
          accent={SUMMARY_ACCENTS[4]}
        />
        <SummaryCard
          title="Pagos de tarjetas"
          value={formatMoneyMany(summary.cardPaymentsByCurrency, summary.baseCurrency)}
          icon={CreditCard}
          accent={SUMMARY_ACCENTS[5]}
        />
      </div>

      <DashNarration monthKey={monthKey} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Tendencia de gastos
          </CardTitle>
          <CardDescription>Últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          {trend.every((point) => point.total === 0) ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay suficientes datos.
            </p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={70}
                    tickFormatter={(value) => formatMoney(Number(value)).replace(/\.00$/, "")}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                    formatter={(value, _name, entry) => {
                      const point = entry?.payload as { currency?: string };
                      return [formatMoney(Number(value), point.currency), "Gasto"];
                    }}
                  />
                  <Bar
                    dataKey="total"
                    radius={[4, 4, 0, 0]}
                    fill="#f59e0b"
                    activeBar={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

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
                          <Cell key={`${entry.name}-${entry.currency}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, _name, entry) => {
                          const point = entry?.payload as { currency?: string };
                          return [formatMoney(Number(value), point.currency), ""];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="w-full space-y-2 text-sm">
                  {summary.categoryBreakdown.map((c, i) => (
                    <li key={`${c.name}-${c.currency}`} className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            background:
                              c.color ?? CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                          }}
                        />
                        <span className="truncate">
                          <CategoryIcon name={c.icon} className="mr-1 inline h-3.5 w-3.5" />
                          {c.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatMoney(c.total, c.currency)}
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
                  <li key={`${c.name}-${c.currency}`} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {cardNameWithLast4(c.name, c.last4)}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatMoney(c.total, c.currency)}
                    </span>
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
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={
                        t.category?.color
                          ? { backgroundColor: t.category.color, color: "#fff" }
                          : undefined
                      }
                    >
                      <CategoryIcon name={t.category?.icon} className="h-4 w-4" />
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

function presenteMultiCurrency(summary: MonthSummary): boolean {
  const keys = new Set([
    ...Object.keys(summary.totalExpensesByCurrency),
    ...Object.keys(summary.totalIncomeByCurrency),
  ]);
  return keys.size > 1;
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  hint,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  hint?: string;
  accent?: { iconBg: string; iconText: string };
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-lg font-semibold">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            accent ? `${accent.iconBg} ${accent.iconText}` : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </CardContent>
    </Card>
  );
}