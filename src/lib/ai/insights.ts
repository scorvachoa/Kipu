import { generateJSON } from "@/lib/ai/generate-json";
import type {
  AnomalyResult,
  ForecastInput,
  SubscriptionResult,
} from "@/lib/finance/analysis";

const money = (value: number): string =>
  value.toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  });

const MONEY_RE = /^\d{1,3}(\.\d{3})*(,\d{2})?$/;

function safeMoney(value: number): string {
  const formatted = money(value);
  return MONEY_RE.test(formatted.replace("S/ ", "")) ||
    MONEY_RE.test(formatted.replace("PEN ", ""))
    ? formatted
    : String(Math.round(value));
}

export async function anomaliesTexto(
  anomalies: AnomalyResult[],
): Promise<string | null> {
  if (anomalies.length === 0) {
    return null;
  }
  const lines = anomalies
    .slice(0, 5)
    .map((a) => {
      const merchant = a.merchant ?? a.categoryName ?? "transacción";
      if (a.merchantAverage !== null && a.merchantMultiplier !== null) {
        return `- ${merchant}: ${safeMoney(a.amount)} (tu promedio es ${safeMoney(a.merchantAverage)}; ~${a.merchantMultiplier.toFixed(1)}x lo habitual)`;
      }
      return `- ${merchant}: ${safeMoney(a.amount)} (muy superior al promedio de ${a.categoryName ?? "su categoría"})`;
    })
    .join("\n");

  const prompt = [
    "Eres el asistente financiero de Kipu. Detectaste gastos inusuales del usuario.",
    "",
    "Gastos anómalos:",
    lines,
    "",
    "Escribe 1-2 frases breves en español que enumere cuáles destacan como más llamativos y sugiera revisar si no son errores o fraudes. No uses emojis ni markdown.",
  ].join("\n");

  const schema = {
    type: "OBJECT",
    properties: { texto: { type: "STRING" } },
    required: ["texto"],
  };

  const parsed = await generateJSON<{ texto: string }>({ prompt, schema });
  return parsed?.texto?.trim() ?? null;
}

function subscriptionLine(sub: SubscriptionResult): string {
  return `- ${sub.merchant}: ~${safeMoney(sub.avgAmount)} por mes (visto ${sub.occurrences} veces en ${sub.monthsActive} meses)`;
}

export async function suscripcionesTexto(
  subscriptions: SubscriptionResult[],
): Promise<string | null> {
  if (subscriptions.length === 0) {
    return null;
  }
  const lines = subscriptions
    .slice(0, 8)
    .map(subscriptionLine)
    .join("\n");

  const prompt = [
    "Eres el asistente financiero de Kipu.",
    "",
    "Cargos recurrentes detectados:",
    lines,
    "",
    "Escribe 2-3 frases en español que resuman en voz natural estos cargos recurrentes, destaquen el más caro y sugieran revisar los que parezcan suscripciones no recordadas. No uses emojis ni markdown.",
  ].join("\n");

  const schema = {
    type: "OBJECT",
    properties: { texto: { type: "STRING" } },
    required: ["texto"],
  };

  const parsed = await generateJSON<{ texto: string }>({ prompt, schema });
  return parsed?.texto?.trim() ?? null;
}

export async function prediccionTexto(
  forecast: {
    projected: number;
    pacePerDay: number;
    input: ForecastInput;
  },
): Promise<string | null> {
  const { projected, pacePerDay, input } = forecast;
  const prompt = [
    "Eres el asistente financiero de Kipu.",
    "",
    `El mes lleva ${input.daysElapsed} días y hay ${input.daysInMonth} en total.`,
    `Gasto acumulado: ${safeMoney(input.spentSoFar)}.`,
    `Ritmo diario proyectado: ${safeMoney(pacePerDay)}.`,
    `Proyección de gasto del mes: ${safeMoney(projected)}.`,
    "", 
    "Escribe 1-2 frases en español con tono neutro: menciona la proyección mensual y una observación útil sobre el ritmo (si el mes va alto, normal o bajo respecto al promedio). No uses emojis ni markdown.",
  ].join("\n");

  const schema = {
    type: "OBJECT",
    properties: { texto: { type: "STRING" } },
    required: ["texto"],
  };

  const parsed = await generateJSON<{ texto: string }>({ prompt, schema });
  return parsed?.texto?.trim() ?? null;
}

export async function semanalTexto(
  total: number,
  transactions: number,
  categories: { name: string; total: number }[],
): Promise<string | null> {
  const top = categories
    .slice(0, 3)
    .map((c) => `${c.name} (${safeMoney(c.total)})`)
    .join(", ");

  const prompt = [
    "Eres el asistente financiero de Kipu.",
    "",
    `Esta semana gastaste ${safeMoney(total)} en ${transactions} movimientos.`,
    `Principales categorías: ${top || "sin datos por categoría"}.`,
    "",
    "Escribe 2-3 frases amables en español que resuman el gasto de la semana, destaquen la categoría más relevante y aporten un consejo breve. No uses emojis ni markdown.",
  ].join("\n");

  const schema = {
    type: "OBJECT",
    properties: { texto: { type: "STRING" } },
    required: ["texto"],
  };

  const parsed = await generateJSON<{ texto: string }>({ prompt, schema });
  return parsed?.texto?.trim() ?? null;
}