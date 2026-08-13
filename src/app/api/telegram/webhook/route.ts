import { error, json } from "@/lib/http";
import { isTrustedTelegramRequest } from "@/lib/telegram/client";

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return error("Webhook de Telegram no configurado", 500);
  }

  if (!isTrustedTelegramRequest(request, secret)) {
    return error("No autorizado", 401);
  }

  return json({ ok: true });
}