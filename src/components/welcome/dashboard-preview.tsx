"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Wallet,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatMoney } from "@/lib/format";
import { CategoryIcon } from "@/components/category-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CHART_DATA = [
  { name: "Alimentación", icon: "Utensils", color: "#f59e0b", value: 1240.5 },
  { name: "Transporte", icon: "Car", color: "#6366f1", value: 610.2 },
  { name: "Entretenimiento", icon: "Clapperboard", color: "#ec4899", value: 420.8 },
  { name: "Compras", icon: "ShoppingCart", color: "#10b981", value: 890.4 },
  { name: "Servicios", icon: "Receipt", color: "#06b6d4", value: 320.1 },
  { name: "Salud", icon: "HeartPulse", color: "#ef4444", value: 180.0 },
];

const SUMMARY_CARDS = [
  {
    title: "Gastos del mes",
    value: formatMoney(3661.0),
    icon: Wallet,
    hint: "48 transacciones",
    iconBg: "bg-indigo-500/10",
    iconText: "text-indigo-600 dark:text-indigo-400",
  },
  {
    title: "Débito",
    value: formatMoney(2140.7),
    icon: ArrowDownLeft,
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Crédito",
    value: formatMoney(1250.3),
    icon: ArrowUpRight,
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-400",
  },
  {
    title: "Pagos de tarjetas",
    value: formatMoney(270.0),
    icon: CreditCard,
    iconBg: "bg-sky-500/10",
    iconText: "text-sky-600 dark:text-sky-400",
  },
];

const CARDS = [
  { name: "BCP ****8795", total: 1490.2 },
  { name: "Interbank ****3902", total: 890.4 },
  { name: "Yape", total: 760.6 },
];

const RECENT = [
  {
    merchant: "Plaza Vea",
    category: "Alimentación",
    icon: "Utensils",
    color: "#f59e0b",
    card: "BCP ****8795",
    amount: -124.5,
    date: "17 ago",
  },
  {
    merchant: "Uber",
    category: "Transporte",
    icon: "Car",
    color: "#6366f1",
    card: "Interbank ****3902",
    amount: -42.8,
    date: "16 ago",
  },
  {
    merchant: "Cineplanet",
    category: "Entretenimiento",
    icon: "Clapperboard",
    color: "#ec4899",
    card: "BCP ****8795",
    amount: -68.0,
    date: "15 ago",
  },
  {
    merchant: "Rappi",
    category: "Alimentación",
    icon: "Utensils",
    color: "#f59e0b",
    card: "Yape",
    amount: -56.9,
    date: "14 ago",
  },
];

export function DashboardPreview() {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-xl sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold capitalize">Agosto de 2026</p>
          <p className="text-sm text-muted-foreground">Resumen de tus gastos</p>
        </div>
        <span className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
          Sincronizar con Gmail
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SUMMARY_CARDS.map((card) => (
          <div key={card.title} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">
                  {card.title}
                </p>
                <p className="mt-1 truncate text-sm font-semibold sm:text-lg">
                  {card.value}
                </p>
                {card.hint ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.hint}
                  </p>
                ) : null}
              </div>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.iconBg} ${card.iconText}`}
              >
                <card.icon className="h-4 w-4" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Por categoría</CardTitle>
            <CardDescription>Distribución de gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-36 w-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={CHART_DATA}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {CHART_DATA.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMoney(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full space-y-1.5 text-sm">
                {CHART_DATA.map((c) => (
                  <li key={c.name} className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: c.color }}
                      />
                      <span className="truncate">
                        <CategoryIcon name={c.icon} className="mr-1 inline h-3 w-3" />
                        {c.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatMoney(c.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Por tarjeta</CardTitle>
            <CardDescription>Gastos según tarjeta usada</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-sm">
              {CARDS.map((c) => (
                <li key={c.name} className="flex items-center justify-between gap-2">
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatMoney(c.total)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Movimientos recientes</CardTitle>
            <CardDescription>Últimas transacciones del mes</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {RECENT.map((t) => (
                <li key={t.merchant} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: t.color, color: "#fff" }}
                    >
                      <CategoryIcon name={t.icon} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm">{t.merchant}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.category} · {t.card}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium">{formatMoney(t.amount)}</p>
                    <p className="text-xs text-muted-foreground">{t.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
