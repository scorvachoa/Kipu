import { generateJSON } from "@/lib/ai/generate-json";
import type { MonthSummary } from "@/lib/finance/summary";
import { DEFAULT_CURRENCY } from "@/types/shared";

function isoCurrency(currency: string): string {
  return { PEN: "PEN", USD: "USD", EUR: "EUR" }[currency] ?? DEFAULT_CURRENCY;
}

const money = (value: number, currency: string = DEFAULT_CURRENCY): string =>
  value.toLocaleString("es-PE", {
    style: "currency",
    currency: isoCurrency(currency),
    minimumFractionDigits: 2,
  });

function totalsText(totals: Record<string, number>): string {
  const entries = Object.entries(totals).filter(([, amount]) => amount !== 0);
  if (entries.length === 0) {
    return money(0);
  }
  entries.sort((a, b) => b[1] - a[1]);
  return entries.map(([currency, amount]) => money(amount, currency)).join(" + ");
}

export interface NaturalQueryContext {
  question: string;
  summary: MonthSummary;
  transactions: { date: string; merchant: string | null; amount: number }[];
}

export async function answerNaturalQuery(
  context: NaturalQueryContext,
): Promise<string | null> {
  const { question, summary, transactions } = context;

  const topCategories = summary.categoryBreakdown
    .slice(0, 5)
    .map((c) => `${c.name}: ${money(c.total, c.currency)}`)
    .join("; ");
  const recent = transactions
    .slice(0, 10)
    .map(
      (tx) =>
        `${tx.date} ${tx.merchant ?? "sin comercio"} ${tx.amount.toFixed(2)}`,
    )
    .join("\n");

  const prompt = [
    "Eres el asistente financiero de Kipu. Respondes preguntas sobre las finanzas del usuario con los datos que se te dan.",
    "",
    `Resumen del mes: total gastado ${totalsText(summary.totalExpensesByCurrency)} en ${summary.transactionCount} movimientos (ingresos ${totalsText(summary.totalIncomeByCurrency)}, saldo neto ${money(summary.netBalance, summary.baseCurrency)}, crédito ${totalsText(summary.creditExpensesByCurrency)}, débito ${totalsText(summary.debitExpensesByCurrency)}).`,
    `Categorías: ${topCategories || "sin datos"}.`,
    transactions.length > 0 ? `Movimientos recientes:\n${recent}` : "Sin movimientos recientes.",
    "",
    `Pregunta del usuario: "${question}"`,
    "",
    "Responde con una respuesta breve y útil en español (máx 80 palabras). Si los datos no permiten responder, dilo claramente. No uses emojis ni markdown.",
    "",
    'Responde SOLO con JSON: {"respuesta": "tu texto"}',
  ]
    .filter(Boolean)
    .join("\n");

  const schema = {
    type: "OBJECT",
    properties: { respuesta: { type: "STRING" } },
    required: ["respuesta"],
  };

  const parsed = await generateJSON<{ respuesta: string }>({ prompt, schema });
  return parsed?.respuesta?.trim() ?? null;
}