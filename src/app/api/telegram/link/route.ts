import { getUser } from "@/lib/auth";
import { error, json } from "@/lib/http";
import {
  createTelegramLinkCode,
  deleteTelegramLinkByUserId,
  getTelegramLinkByUserId,
  updateTelegramPrefs,
} from "@/lib/supabase/telegram-adapter";
import { getTelegramBotInfo } from "@/lib/telegram/client";

export async function POST() {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return error("Telegram no configurado", 500);
  }

  const code = await createTelegramLinkCode(user.id);
  const bot = await getTelegramBotInfo();

  return json({
    code,
    bot_username: bot?.username ?? null,
  });
}

export async function DELETE() {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }

  await deleteTelegramLinkByUserId(user.id);
  return json({ ok: true });
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }

  const link = await getTelegramLinkByUserId(user.id);
  if (!link) {
    return error("Telegram no conectado", 400);
  }

  const body = (await request.json().catch(() => null)) as {
    notify_new_expenses?: unknown;
    notify_payments?: unknown;
    notify_needs_review?: unknown;
  } | null;

  const prefs: Record<string, boolean> = {};
  for (const key of [
    "notify_new_expenses",
    "notify_payments",
    "notify_needs_review",
  ] as const) {
    if (typeof body?.[key] === "boolean") {
      prefs[key] = body[key];
    }
  }

  await updateTelegramPrefs(user.id, prefs);
  return json({ ok: true });
}