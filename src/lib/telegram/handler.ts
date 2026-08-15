import { createAdminClient } from "@/lib/supabase/admin";
import {
  consumeTelegramLinkCode,
  deleteTelegramLinkByUserId,
  getTelegramLinkByChatId,
  upsertTelegramLink,
} from "@/lib/supabase/telegram-adapter";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { parseCommand } from "@/lib/telegram/parser";
import type {
  TelegramUpdate,
  TelegramMessage,
} from "@/types/telegram";
import { getMonthSummaryRows, listTransactions } from "@/lib/supabase/queries";
import { aggregateMonthSummary } from "@/lib/finance/summary";
import { currentMonthKey } from "@/lib/finance/time";
import type { SummaryTx } from "@/lib/finance/summary";
import {
  formatCardBreakdown,
  formatCategoriesBreakdown,
  formatMonthSummary,
  formatRecentExpenses,
  formatAnomalies,
  formatSubscriptions,
  type TelegramCardBreakdown,
  type TelegramRecentExpense,
} from "@/lib/telegram/messages";
import { syncUserGmail } from "@/lib/gmail/sync-service";
import type { SyncRange } from "@/lib/gmail/query";
import { resumenMensualConGemini } from "@/lib/ai/month-resumen";
import {
  detectAnomalies,
  detectSubscriptions,
  forecastMonthlyTotal,
} from "@/lib/finance/analysis";
import {
  anomaliesTexto,
  suscripcionesTexto,
  prediccionTexto,
  semanalTexto,
} from "@/lib/ai/insights";
import { answerNaturalQuery } from "@/lib/ai/natural-query";
import { enrichMerchant } from "@/lib/ai/merchant-enrich";
import { suggestRule } from "@/lib/ai/rule-suggest";
import { createMerchantRule } from "@/lib/supabase/merchant-rule";
import { listCategories } from "@/lib/supabase/queries";
import {
  startOfWeek,
  endOfWeek,
  format,
  getDaysInMonth,
} from "date-fns";
import { DEFAULT_TIMEZONE } from "@/types/shared";

const UNLINKED_MESSAGE =
  "Este Telegram no está vinculado a una cuenta Kipu.";

const HELP_TEXT = `🤖 *Comandos de Kipu*

*Consultas generales*
/ayuda — Ver esta ayuda
/resumen — Resumen del mes actual
/gastos — Últimos 10 gastos
/tarjetas — Gastos por tarjeta
/categorias — Gastos por categoría
/sincronizar — Sincronizar con Gmail

*Inteligencia artificial*
/anomalias — Detecta gastos inusuales
/suscripciones — Detecta cargos recurrentes
/prediccion — Proyecta el gasto del mes
/semana — Resumen inteligente de esta semana
/descifrar COMERCIO — Identifica un comercio
/regla COMERCIO — Sugiere y crea una regla de categoría
/pregunta TEXTO — Pregunta en lenguaje natural

*Cuenta*
/desvincular — Desvincular este chat`;

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message ?? update.edited_message;
  if (!message?.text) {
    return null;
  }

  const parsed = parseCommand(message.text);
  if (!parsed) {
    return handleNaturalQuery(message);
  }

  switch (parsed.name) {
    case "/start":
      return handleStart(message, parsed.args);
    case "/ayuda":
    case "/help":
      return handleHelp(message);
    case "/desvincular":
      return handleUnlink(message);
    default:
      return handleLinkedCommand(message, parsed.name, parsed.args);
  }
}

async function handleStart(message: TelegramMessage, args: string) {
  const chatId = message.chat.id;

  if (!args) {
    return sendTelegramMessage(
      chatId,
      `Hola 👋 Soy el bot de Kipu.\n\nPara vincular tu cuenta:\n1. Entra a Configuración en Kipu.\n2. Pulsa "Conectar Telegram".\n3. Escribe aquí el código que aparece:\n\n/start CODIGO`,
    );
  }

  const code = args.trim().toLowerCase();
  const userId = await consumeTelegramLinkCode(code);
  if (!userId) {
    return sendTelegramMessage(
      chatId,
      "El código no es válido o ya expiró. Genera uno nuevo en Configuración.",
    );
  }

  await upsertTelegramLink(userId, chatId);
  return sendTelegramMessage(
    chatId,
    "✅ Cuenta vinculada. Ya recibirás avisos de tus movimientos aquí.\n\nEscribe /ayuda para ver los comandos.",
  );
}

async function handleHelp(message: TelegramMessage) {
  return sendTelegramMessage(message.chat.id, HELP_TEXT);
}

async function handleUnlink(message: TelegramMessage) {
  const link = await getTelegramLinkByChatId(message.chat.id);
  if (!link) {
    return sendTelegramMessage(message.chat.id, UNLINKED_MESSAGE);
  }
  await deleteTelegramLinkByUserId(link.user_id);
  return sendTelegramMessage(
    message.chat.id,
    "Listo, este chat ya no está vinculado a Kipu.",
  );
}

async function handleLinkedCommand(
  message: TelegramMessage,
  command: string,
  args: string,
) {
  const link = await getTelegramLinkByChatId(message.chat.id);
  if (!link) {
    return sendTelegramMessage(message.chat.id, UNLINKED_MESSAGE);
  }

  switch (command) {
    case "/resumen":
      return handleResumen(link.user_id, message.chat.id);
    case "/gastos":
      return handleGastos(link.user_id, message.chat.id);
    case "/tarjetas":
      return handleTarjetas(link.user_id, message.chat.id);
    case "/categorias":
      return handleCategorias(link.user_id, message.chat.id);
    case "/sincronizar":
      return handleSincronizar(link.user_id, message.chat.id, args);
    case "/anomalias":
      return handleAnomalias(link.user_id, message.chat.id);
    case "/suscripciones":
      return handleSuscripciones(link.user_id, message.chat.id);
    case "/prediccion":
      return handlePrediccion(link.user_id, message.chat.id);
    case "/semana":
      return handleSemana(link.user_id, message.chat.id);
    case "/descifrar":
      return handleDescifrar(link.user_id, message.chat.id, args);
    case "/regla":
      return handleRegla(link.user_id, message.chat.id, args);
    case "/pregunta":
      return handlePregunta(link.user_id, message.chat.id, args);
    default:
      return null;
  }
}

async function handleResumen(userId: string, chatId: number) {
  const admin = createAdminClient();
  const monthKey = currentMonthKey();
  const rows = await getMonthSummaryRows(admin, userId, monthKey);
  const summary = aggregateMonthSummary(rows, monthKey);

  const parts: string[] = [];

  const aiResumen = await resumenMensualConGemini(summary);
  if (aiResumen) {
    parts.push(aiResumen);
  }

  parts.push(formatMonthSummary(summary));
  return sendTelegramMessage(chatId, parts.join("\n\n"));
}

async function handleGastos(userId: string, chatId: number) {
  const admin = createAdminClient();
  const rows = await listTransactions(admin, userId, {
    transactionType: "purchase",
  });
  const lastTen = rows.slice(0, 10);

  if (lastTen.length === 0) {
    return sendTelegramMessage(chatId, "No hay gastos para mostrar.");
  }

  const expenses: TelegramRecentExpense[] = lastTen.map((row) =>
    toRecentExpense(row),
  );
  return sendTelegramMessage(chatId, formatRecentExpenses(expenses));
}

async function handleTarjetas(userId: string, chatId: number) {
  const admin = createAdminClient();
  const monthKey = currentMonthKey();
  const rows = await getMonthSummaryRows(admin, userId, monthKey);
  const summary = aggregateMonthSummary(rows, monthKey);

  if (summary.cardBreakdown.length === 0) {
    return sendTelegramMessage(chatId, "No hay gastos por tarjeta.");
  }

  const cards: TelegramCardBreakdown[] = summary.cardBreakdown.map((card) => ({
    name: card.name,
    bank: card.bank,
    last4: card.last4,
    total: card.total,
  }));
  return sendTelegramMessage(chatId, formatCardBreakdown(cards));
}

async function handleCategorias(userId: string, chatId: number) {
  const admin = createAdminClient();
  const monthKey = currentMonthKey();
  const rows = await getMonthSummaryRows(admin, userId, monthKey);
  const summary = aggregateMonthSummary(rows, monthKey);

  if (summary.categoryBreakdown.length === 0) {
    return sendTelegramMessage(chatId, "No hay gastos por categoría.");
  }

  return sendTelegramMessage(
    chatId,
    formatCategoriesBreakdown(summary.categoryBreakdown),
  );
}

async function handleSincronizar(
  userId: string,
  chatId: number,
  args: string,
) {
  await sendTelegramMessage(chatId, "🔄 Sincronizando Gmail…");

  const range = normalizeCommandRange(args);
  try {
    const outcome = await syncUserGmail(userId, range);
    const lines = [
      "✅ Sincronización completada",
      "",
      `Nuevos movimientos: ${outcome.transactionsCreated}`,
      `Duplicados ignorados: ${outcome.duplicatesFound}`,
      `Requieren revisión: ${outcome.requiresReview}`,
    ];
    if (outcome.errors > 0) {
      lines.push(`Errores: ${outcome.errors}`);
    }
    return sendTelegramMessage(chatId, lines.join("\n"));
  } catch {
    return sendTelegramMessage(
      chatId,
      "No se pudo sincronizar. Verifica que Gmail esté conectado.",
    );
  }
}

function toRecentExpense(row: SummaryTx): TelegramRecentExpense {
  return {
    transaction_date: row.transaction_date,
    transaction_time: row.transaction_time,
    merchant: row.merchant,
    amount: row.amount,
    currency: row.currency,
    category_name: row.categories?.name ?? null,
    category_icon: row.categories?.icon ?? null,
    card_label: row.cards
      ? `${row.cards.bank} ****${row.cards.last4}`
      : null,
  };
}

async function handleAnomalias(userId: string, chatId: number) {
  const admin = createAdminClient();
  await sendTelegramMessage(chatId, "🔍 Buscando gastos inusuales…");

  const rows = await listTransactions(admin, userId);
  const anomalies = detectAnomalies(rows).filter(
    (anomaly) => anomaly.severity === "high",
  );

  if (anomalies.length === 0) {
    return sendTelegramMessage(
      chatId,
      "✅ No se detectaron gastos inusuales en tu historial reciente.",
    );
  }

  const parts: string[] = [];
  const aiTexto = await anomaliesTexto(anomalies);
  if (aiTexto) {
    parts.push(aiTexto);
  }
  parts.push(formatAnomalies(anomalies));
  return sendTelegramMessage(chatId, parts.join("\n\n"));
}

async function handleSuscripciones(userId: string, chatId: number) {
  const admin = createAdminClient();

  const rows = await listTransactions(admin, userId);
  const subscriptions = detectSubscriptions(rows);

  if (subscriptions.length === 0) {
    return sendTelegramMessage(
      chatId,
      "No se detectaron suscripciones o cargos recurrentes.",
    );
  }

  const parts: string[] = [];
  const aiTexto = await suscripcionesTexto(subscriptions);
  if (aiTexto) {
    parts.push(aiTexto);
  }
  parts.push(formatSubscriptions(subscriptions));
  return sendTelegramMessage(chatId, parts.join("\n\n"));
}

async function handlePrediccion(userId: string, chatId: number) {
  const admin = createAdminClient();

  const now = new Date();
  const monthKey = currentMonthKey(now);
  const rows = await getMonthSummaryRows(admin, userId, monthKey);
  const summary = aggregateMonthSummary(rows, monthKey);

  const daysElapsed = parseInt(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: DEFAULT_TIMEZONE,
      day: "numeric",
    }).format(now),
    10,
  );
  const daysInMonth = getDaysInMonth(now);
  const averageDailyPastMonths = await averageDailyPreviousMonths(
    userId,
    now,
  );

  const forecast = forecastMonthlyTotal({
    spentSoFar: summary.totalExpenses,
    daysElapsed,
    daysInMonth,
    averageDailyPastMonths,
  });

  const parts: string[] = [];
  const aiTexto = await prediccionTexto({
    projected: forecast.projected,
    pacePerDay: forecast.pacePerDay,
    input: {
      spentSoFar: summary.totalExpenses,
      daysElapsed,
      daysInMonth,
      averageDailyPastMonths,
    },
  });
  if (aiTexto) {
    parts.push(aiTexto);
  }
  parts.push(
    [
      `📈 Proyección del mes: ${formatGasto(forecast.projected)}`,
      `Ritmo diario: ${formatGasto(forecast.pacePerDay)}`,
      summary.totalExpenses > 0
        ? `Gastado hasta hoy: ${formatGasto(summary.totalExpenses)}`
        : "Todavía no hay gastos este mes.",
    ].join("\n"),
  );
  return sendTelegramMessage(chatId, parts.join("\n\n"));
}

async function averageDailyPreviousMonths(
  userId: string,
  now: Date,
): Promise<number> {
  const admin = createAdminClient();
  const months: { total: number; days: number }[] = [];

  for (let i = 1; i <= 3; i++) {
    const previous = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = currentMonthKey(previous);
    const rows = await getMonthSummaryRows(admin, userId, key);
    const summary = aggregateMonthSummary(rows, key);
    if (summary.totalExpenses > 0) {
      months.push({
        total: summary.totalExpenses,
        days: getDaysInMonth(previous),
      });
    }
  }

  if (months.length === 0) {
    return 0;
  }
  const totalDays = months.reduce((acc, m) => acc + m.days, 0);
  const totalSpent = months.reduce((acc, m) => acc + m.total, 0);
  return totalSpent / totalDays;
}

function formatGasto(value: number): string {
  return `S/ ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function handleSemana(userId: string, chatId: number) {
  const admin = createAdminClient();

  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  const startDate = format(start, "yyyy-MM-dd");
  const endDate = format(end, "yyyy-MM-dd");

  const rows = await listTransactions(admin, userId);
  const weekExpenses = rows.filter(
    (row) =>
      row.transaction_date >= startDate && row.transaction_date <= endDate,
  );

  if (weekExpenses.length === 0) {
    return sendTelegramMessage(chatId, "Esta semana no hay gastos registrados.");
  }

  const total = weekExpenses.reduce((acc, row) => acc + row.amount, 0);
  const byCategory = new Map<string, number>();
  for (const row of weekExpenses) {
    const name = row.categories?.name ?? "Sin categoría";
    byCategory.set(name, (byCategory.get(name) ?? 0) + row.amount);
  }
  const categories = [...byCategory.entries()]
    .map(([name, totalCat]) => ({ name, total: totalCat }))
    .sort((a, b) => b.total - a.total);

  const parts: string[] = [];
  const aiTexto = await semanalTexto(
    total,
    weekExpenses.length,
    categories,
  );
  if (aiTexto) {
    parts.push(aiTexto);
  }
  parts.push(
    [
      `📅 Semana del ${format(start, "dd/MM")} al ${format(end, "dd/MM")}`,
      `Total: ${formatGasto(total)}`,
      `Movimientos: ${weekExpenses.length}`,
    ].join("\n"),
  );
  return sendTelegramMessage(chatId, parts.join("\n\n"));
}

async function handleDescifrar(
  userId: string,
  chatId: number,
  args: string,
) {
  const merchant = args.trim();
  if (!merchant) {
    return sendTelegramMessage(
      chatId,
      "Uso: /descifrar NOMBRE_DEL_COMERCIO",
    );
  }

  await sendTelegramMessage(chatId, "🔎 Analizando el comercio…");

  const admin = createAdminClient();
  const categories = await listCategories(admin, userId);
  const knownMerchants = [...categories]
    .filter((category) => category.name)
    .map((category) => ({
      name: category.name,
      category: category.name,
    }));

  const enrichment = await enrichMerchant(
    merchant,
    categories,
    knownMerchants,
  );
  if (!enrichment) {
    return sendTelegramMessage(
      chatId,
      "No pude identificar ese comercio. Intenta con otro nombre.",
    );
  }

  const lines = [
    `🏪 Comercio: ${merchant}`,
    enrichment.readable_name
      ? `Nombre: ${enrichment.readable_name}`
      : null,
    enrichment.category
      ? `Categoría sugerida: ${enrichment.category}`
      : "Categoría: no claro",
    "",
    "Escribe /regla " + merchant + " para crear una regla automática.",
  ].filter((line) => line !== null) as string[];
  return sendTelegramMessage(chatId, lines.join("\n"));
}

async function handleRegla(userId: string, chatId: number, args: string) {
  const merchant = args.trim();
  if (!merchant) {
    return sendTelegramMessage(chatId, "Uso: /regla NOMBRE_DEL_COMERCIO");
  }

  await sendTelegramMessage(
    chatId,
    `🤖 Creando regla para "${merchant}"…`,
  );

  const admin = createAdminClient();
  const categories = await listCategories(admin, userId);
  if (categories.length === 0) {
    return sendTelegramMessage(
      chatId,
      "No hay categorías configuradas. Crea una primero en el dashboard.",
    );
  }

  const suggestion = await suggestRule(
    merchant,
    categories.map((category) => ({
      id: category.id,
      name: category.name,
    })),
  );
  if (!suggestion) {
    return sendTelegramMessage(
      chatId,
      "No pude sugerir una regla para ese comercio.",
    );
  }

  const category = categories.find(
    (categoryItem) => categoryItem.id === suggestion.category_id,
  );
  try {
    await createMerchantRule(
      admin,
      userId,
      suggestion.merchant_pattern,
      suggestion.category_id,
    );
  } catch {
    return sendTelegramMessage(
      chatId,
      "No se pudo guardar la regla. Intenta de nuevo más tarde.",
    );
  }
  const message = [
    `✅ Regla creada para ${merchant}`,
    `Patrón: ${suggestion.merchant_pattern}`,
    `Categoría: ${category?.name ?? suggestion.category_id}`,
    "",
    "Las nuevas transacciones que coincidan se categorizarán automáticamente.",
  ].join("\n");
  return sendTelegramMessage(chatId, message);
}

async function handlePregunta(
  userId: string,
  chatId: number,
  args: string,
) {
  const question = args.trim();
  if (!question) {
    return sendTelegramMessage(
      chatId,
      "Uso: /pregunta TU_PREGUNTA, por ejemplo: ¿cuánto gasté en restaurantes?",
    );
  }

  await sendTelegramMessage(chatId, "🤔 Pensando…");

  const admin = createAdminClient();
  const monthKey = currentMonthKey();
  const [rows, monthRows] = await Promise.all([
    listTransactions(admin, userId),
    getMonthSummaryRows(admin, userId, monthKey),
  ]);
  const summary = aggregateMonthSummary(monthRows, monthKey);

  const context = {
    question,
    summary,
    transactions: rows.map((row) => ({
      date: row.transaction_date,
      merchant: row.merchant,
      amount: row.amount,
    })),
  };

  const answer = await answerNaturalQuery(context);
  return sendTelegramMessage(
    chatId,
    answer ?? "No encontré una respuesta para esa pregunta. Intenta ser más específico.",
  );
}

async function handleNaturalQuery(message: TelegramMessage) {
  const text = message.text?.trim();
  if (!text || isProbablyNotQuestion(text)) {
    return null;
  }

  const link = await getTelegramLinkByChatId(message.chat.id);
  if (!link) {
    return null;
  }

  return handlePregunta(link.user_id, message.chat.id, text);
}

function isProbablyNotQuestion(text: string): boolean {
  if (text.length > 160) {
    return true;
  }
  const questionMark = text.includes("?") || text.includes("¿");
  const interrogative = /^(qué|cu[áa]nto|qu[ée]|d[óo]nde|cu[áa]ndo|c[óo]mo|por qu[ée]|cu[áa]l)/i.test(
    text,
  );
  return !questionMark && !interrogative;
}

function normalizeCommandRange(args: string): SyncRange | undefined {
  const valid: SyncRange[] = ["30d", "3m", "6m", "12m"];
  return valid.includes(args.trim() as SyncRange)
    ? (args.trim() as SyncRange)
    : undefined;
}