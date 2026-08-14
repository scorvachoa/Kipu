const TELEGRAM_API = "https://api.telegram.org";

export interface SendMessageOptions {
  replyToMessageId?: number;
}

export function telegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }
  return token;
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options: SendMessageOptions = {},
): Promise<boolean> {
  const response = await fetch(
    `${TELEGRAM_API}/bot${telegramBotToken()}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_to_message_id: options.replyToMessageId,
      }),
    },
  );

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { ok: boolean };
  return data.ok === true;
}

export async function setTelegramWebhook(
  url: string,
  secretToken: string,
): Promise<void> {
  const response = await fetch(
    `${TELEGRAM_API}/bot${telegramBotToken()}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, secret_token: secretToken }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to set Telegram webhook: ${response.status}`);
  }
}

export const TELEGRAM_WEBHOOK_SECRET_HEADER = "x-telegram-bot-api-secret-token";

export function isTrustedTelegramRequest(
  request: Request,
  secretToken: string,
): boolean {
  const header = request.headers.get(TELEGRAM_WEBHOOK_SECRET_HEADER);
  return header === secretToken;
}

export async function getTelegramBotInfo(): Promise<{
  username: string;
  firstName: string;
} | null> {
  const response = await fetch(
    `${TELEGRAM_API}/bot${telegramBotToken()}/getMe`,
    { method: "GET" },
  );
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as {
    ok: boolean;
    result?: { username?: string; first_name: string };
  };
  if (!data.ok || !data.result) {
    return null;
  }
  const { result } = data;
  return {
    username: result.username ?? "",
    firstName: result.first_name,
  };
}