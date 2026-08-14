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
  type TelegramCardBreakdown,
  type TelegramRecentExpense,
} from "@/lib/telegram/messages";
import { syncUserGmail } from "@/lib/gmail/sync-service";
import type { SyncRange } from "@/lib/gmail/query";

const UNLINKED_MESSAGE =
  "Este Telegram no está vinculado a una cuenta Kipu.";

const HELP_TEXT = `🤖 *Comandos de Kipu*

/ayuda — Ver esta ayuda
/resumen — Resumen del mes actual
/gastos — Últimos 10 gastos
/tarjetas — Gastos por tarjeta
/categorias — Gastos por categoría
/sincronizar — Sincronizar con Gmail
/desvincular — Desvincular este chat`;

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message ?? update.edited_message;
  if (!message?.text) {
    return null;
  }

  const parsed = parseCommand(message.text);
  if (!parsed) {
    return null;
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
    default:
      return null;
  }
}

async function handleResumen(userId: string, chatId: number) {
  const admin = createAdminClient();
  const monthKey = currentMonthKey();
  const rows = await getMonthSummaryRows(admin, userId, monthKey);
  const summary = aggregateMonthSummary(rows, monthKey);
  return sendTelegramMessage(chatId, formatMonthSummary(summary));
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

function normalizeCommandRange(args: string): SyncRange | undefined {
  const valid: SyncRange[] = ["30d", "3m", "6m", "12m"];
  return valid.includes(args.trim() as SyncRange)
    ? (args.trim() as SyncRange)
    : undefined;
}