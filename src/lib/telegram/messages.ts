import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatMoney, formatMoneyMany } from "@/lib/format";
import type { MonthSummary } from "@/lib/finance/summary";
import { monthLabel } from "@/lib/finance/summary";
import { formatTransactionDate } from "@/lib/finance/time";

const TYPE_LABELS: Record<string, string> = {
  purchase: "NUEVO GASTO",
  payment: "NUEVO PAGO",
  withdrawal: "RETIRO DE CAJERO",
  transfer: "TRANSFERENCIA",
  refund: "REEMBOLSO",
  fee: "COMISIÓN",
  income: "INGRESO",
  other: "MOVIMIENTO",
};

const TYPE_EMOJIS: Record<string, string> = {
  purchase: "💳",
  payment: "💵",
  withdrawal: "🏧",
  transfer: "🔁",
  refund: "↩️",
  fee: "🧾",
  income: "💰",
  other: "📌",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Utensils: "🍔",
  Car: "🚗",
  ShoppingCart: "🛍️",
  Clapperboard: "🎬",
  Receipt: "🧾",
  HeartPulse: "❤️",
  GraduationCap: "🎓",
  Plane: "✈️",
  Repeat: "🔄",
  Home: "🏠",
  Landmark: "🏦",
  MoreHorizontal: "📦",
};

export function categoryEmoji(icon: string | null | undefined): string {
  if (!icon) return "📦";
  return CATEGORY_EMOJIS[icon] ?? "📦";
}

export interface TelegramTxNotification {
  bank: string;
  merchant: string | null;
  amount: number;
  currency: string;
  transaction_type: string;
  transaction_date: string;
  transaction_time: string | null;
  status: string;
  card_label: string | null;
  person_name: string | null;
  category_name: string | null;
  category_icon: string | null;
}

export function formatTransactionNotification(
  tx: TelegramTxNotification,
): string {
  const emoji = TYPE_EMOJIS[tx.transaction_type] ?? "📌";
  const label = TYPE_LABELS[tx.transaction_type] ?? "MOVIMIENTO";
  const header =
    tx.status === "needs_review" ? `⚠️ ${label}` : `${emoji} ${label}`;

  const lines = [header, ""];
  lines.push(`🏦 ${tx.bank}`);
  if (tx.merchant) {
    lines.push(`🏪 ${tx.merchant}`);
  }
  lines.push(`💰 ${formatMoney(tx.amount, tx.currency)}`);
  lines.push("");

  if (tx.card_label) {
    lines.push(`💳 ${tx.card_label}`);
  }
  if (tx.person_name) {
    lines.push(`👤 ${tx.person_name}`);
  }
  if (tx.category_name) {
    lines.push(`📁 ${categoryEmoji(tx.category_icon)} ${tx.category_name}`);
  }
  lines.push("");
  lines.push(
    `📅 ${formatTransactionDate(tx.transaction_date, tx.transaction_time)}`,
  );

  if (tx.status === "needs_review") {
    lines.push("");
    lines.push("Corrige la transacción en Kipu.");
  }

  return lines.join("\n");
}

export function formatMonthSummary(summary: MonthSummary): string {
  const lines = [`📊 Kipu — ${monthLabel(summary.monthKey)}`, ""];

  lines.push(`💰 Gastos:`);
  lines.push(formatMoneyMany(summary.totalExpensesByCurrency, summary.baseCurrency));
  lines.push("");
  lines.push(`💳 Crédito:`);
  lines.push(formatMoneyMany(summary.creditExpensesByCurrency, summary.baseCurrency));
  lines.push("");
  lines.push(`💵 Débito:`);
  lines.push(formatMoneyMany(summary.debitExpensesByCurrency, summary.baseCurrency));
  lines.push("");
  lines.push(`💰 Ingresos:`);
  lines.push(formatMoneyMany(summary.totalIncomeByCurrency, summary.baseCurrency));
  lines.push("");
  lines.push(`📊 Saldo neto:`);
  lines.push(formatMoney(summary.netBalance, summary.baseCurrency));

  if (summary.categoryBreakdown.length > 0) {
    lines.push("");
    for (const category of summary.categoryBreakdown.slice(0, 5)) {
      lines.push(`${categoryEmoji(category.icon)} ${category.name}:`);
      lines.push(formatMoney(category.total, category.currency));
    }
  }

  return lines.join("\n");
}

export interface TelegramRecentExpense {
  transaction_date: string;
  transaction_time: string | null;
  merchant: string | null;
  amount: number;
  currency: string;
  category_name: string | null;
  category_icon: string | null;
  card_label: string | null;
}

export function formatRecentExpenses(expenses: TelegramRecentExpense[]): string {
  const lines = ["💳 Últimos gastos", ""];

  for (const expense of expenses) {
    const date = format(
      parseISO(expense.transaction_date),
      "d MMM",
      { locale: es },
    );
    lines.push(date);
    lines.push(expense.merchant ?? "Sin comercio");
    lines.push(formatMoney(expense.amount, expense.currency));
    if (expense.category_name) {
      lines.push(
        `${categoryEmoji(expense.category_icon)} ${expense.category_name}`,
      );
    }
    if (expense.card_label) {
      lines.push(expense.card_label);
    }
    lines.push("");
  }

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}

export interface TelegramCardBreakdown {
  name: string;
  bank: string | null;
  last4: string | null;
  total: number;
}

export function formatCardBreakdown(cards: TelegramCardBreakdown[]): string {
  const lines = ["💳 Mis tarjetas", ""];

  for (const card of cards) {
    const name = card.last4 ? `${card.name} ****${card.last4}` : card.name;
    lines.push(name);
    lines.push(formatMoney(card.total));
    lines.push("");
  }

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}

export function formatCategoriesBreakdown(
  categories: { name: string; icon: string | null; total: number }[],
): string {
  const lines = ["📁 Gastos por categoría", ""];

  for (const category of categories) {
    lines.push(`${categoryEmoji(category.icon)} ${category.name}:`);
    lines.push(formatMoney(category.total));
    lines.push("");
  }

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}

export function formatAnomalies(
  anomalies: {
    merchant: string | null;
    amount: number;
    currency: string;
    categoryName: string | null;
    merchantAverage: number | null;
    merchantMultiplier: number | null;
    categoryAverage: number | null;
  }[],
): string {
  const lines = ["🚨 Posibles gastos anómalos", ""];

  if (anomalies.length === 0) {
    lines.push("No se detectaron gastos inusuales.");
    return lines.join("\n");
  }

  for (const anomaly of anomalies) {
    const merchant = anomaly.merchant ?? anomaly.categoryName ?? "Desconocido";
    lines.push(`🏪 ${merchant}`);
    lines.push(formatMoney(anomaly.amount, anomaly.currency));
    if (anomaly.merchantAverage !== null && anomaly.merchantMultiplier !== null) {
      lines.push(
        `Promedio: ${formatMoney(anomaly.merchantAverage, anomaly.currency)} (~${anomaly.merchantMultiplier.toFixed(1)}x lo habitual)`,
      );
    } else if (anomaly.categoryAverage !== null) {
      lines.push(
        `Promedio de ${anomaly.categoryName}: ${formatMoney(anomaly.categoryAverage, anomaly.currency)}`,
      );
    }
    lines.push("");
  }

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}

export function formatSubscriptions(
  subscriptions: {
    merchant: string;
    avgAmount: number;
    occurrences: number;
    monthsActive: number;
    lastDate: string | null;
  }[],
): string {
  const lines = ["🔄 Cargos recurrentes detectados", ""];

  if (subscriptions.length === 0) {
    lines.push("No se detectaron suscripciones o cargos recurrentes.");
    return lines.join("\n");
  }

  for (const subscription of subscriptions) {
    lines.push(`🏪 ${subscription.merchant}`);
    lines.push(`Frecuencia: ${subscription.occurrences} cargos en ${subscription.monthsActive} mes(es)`);
    lines.push(structuredMoney(subscription.avgAmount));
    if (subscription.lastDate) {
      lines.push(`Último: ${formatTransactionDate(subscription.lastDate, null)}`);
    }
    lines.push("");
  }

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}

function structuredMoney(amount: number): string {
  return `Monto promedio: ${formatMoney(amount)}`;
}