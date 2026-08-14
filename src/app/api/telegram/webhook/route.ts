import { error, json } from "@/lib/http";
import { isTrustedTelegramRequest } from "@/lib/telegram/client";
import { handleTelegramUpdate } from "@/lib/telegram/handler";
import type { TelegramUpdate } from "@/types/telegram";

export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return error("Webhook de Telegram no configurado", 500);
  }

  if (!isTrustedTelegramRequest(request, secret)) {
    return error("No autorizado", 401);
  }

  const update = (await request.json()) as TelegramUpdate;

  try {
    await handleTelegramUpdate(update);
  } catch (err) {
    console.error("Telegram webhook error:", err);
  }

  return json({ ok: true });
}