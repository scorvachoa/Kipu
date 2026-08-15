import type { MonthSummary } from "@/lib/finance/summary";
import { monthLabel } from "@/lib/finance/summary";
import { generateJSON } from "./generate-json";
import { hasAiProvider } from "./providers";

interface MonthResumenResult {
  resumen: string;
}

function money(value: number): string {
  return value.toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  });
}

/**
 * Genera un párrafo corto en lenguaje natural con los datos del mes.
 * Devuelve null si no hay API key, si falla la llamada o si la salida
 * no es parseable, para que el llamador caiga en el formato numérico.
 */
export async function resumenMensualConGemini(
  summary: MonthSummary,
): Promise<string | null> {
  if (!hasAiProvider()) {
    return null;
  }

  const topCategories = summary.categoryBreakdown
    .slice(0, 4)
    .map((c) => `${c.name}: ${money(c.total)}`)
    .join("; ");

  const topCards = summary.cardBreakdown
    .slice(0, 3)
    .map((c) => `${c.name}: ${money(c.total)}`)
    .join("; ");

  const latestMerchants = summary.latest
    .filter((tx) => tx.transaction_type === "purchase" && tx.merchant)
    .slice(0, 3)
    .map((tx) => tx.merchant as string)
    .join(", ");

  const prompt = [
    `Eres el asistente financiero de Kipu. Resumen del usuario para ${monthLabel(summary.monthKey)}:`,
    "",
    `Gastos totales: ${money(summary.totalExpenses)} (${summary.transactionCount} movimientos).`,
    `Crédito: ${money(summary.creditExpenses)}. Débito: ${money(summary.debitExpenses)}.`,
    `Pago de tarjetas: ${money(summary.cardPayments)}.`,
    `Top categorías: ${topCategories || "sin datos"}.`,
    `Top tarjetas: ${topCards || "sin datos"}.`,
    latestMerchants ? `Comercios frecuentes: ${latestMerchants}.` : "",
    "",
    "Escribe 2-3 frases breves y amables en español (máx 40 palabras) que resuman en lenguaje natural estos números: destaca el total, la categoría o tarjeta más relevante y algún matiz útil (por ejemplo si un rubro domina). Evita inventar datos. No uses emojis ni markdown.",
    "",
    'Responde SOLO con JSON: {"resumen": "tu texto"}.',
  ]
    .filter(Boolean)
    .join("\n");

  const schema = {
    type: "OBJECT",
    properties: {
      resumen: { type: "STRING" },
    },
    required: ["resumen"],
  };

  try {
    const parsed = await generateJSON<MonthResumenResult>({ prompt, schema });
    const resumen = parsed?.resumen?.trim();
    if (!resumen) {
      return null;
    }
    return resumen;
  } catch {
    return null;
  }
}