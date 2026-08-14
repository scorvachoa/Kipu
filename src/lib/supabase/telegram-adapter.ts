import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  TelegramLink,
  TelegramNotificationPrefs,
} from "@/types/telegram";

const LINK_CODE_TTL_MS = 10 * 60 * 1000;

export async function createTelegramLinkCode(userId: string): Promise<string> {
  const code = randomBytes(6).toString("hex");
  const admin = createAdminClient();
  const { error } = await admin.from("telegram_link_codes").insert({
    code,
    user_id: userId,
    expires_at: new Date(Date.now() + LINK_CODE_TTL_MS).toISOString(),
  } as never);
  if (error) {
    throw error;
  }
  return code;
}

export async function consumeTelegramLinkCode(
  code: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("telegram_link_codes")
    .select("user_id, expires_at")
    .eq("code", code)
    .maybeSingle();
  if (error) {
    throw error;
  }

  await admin.from("telegram_link_codes").delete().eq("code", code);

  if (!data || new Date(data.expires_at) <= new Date()) {
    return null;
  }
  return data.user_id;
}

export async function getTelegramLinkByUserId(
  userId: string,
): Promise<TelegramLink | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("telegram_links")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data as TelegramLink | null) ?? null;
}

export async function getTelegramLinkByChatId(
  chatId: string | number,
): Promise<TelegramLink | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("telegram_links")
    .select("*")
    .eq("telegram_user_id", String(chatId))
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data as TelegramLink | null) ?? null;
}

export async function listTelegramLinks(
  userId: string,
): Promise<TelegramLink[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("telegram_links")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
  return (data ?? []) as TelegramLink[];
}

export async function upsertTelegramLink(
  userId: string,
  chatId: string | number,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("telegram_links").upsert(
    {
      user_id: userId,
      telegram_user_id: String(chatId),
    } as never,
    { onConflict: "user_id,telegram_user_id" },
  );
  if (error) {
    throw error;
  }
}

export async function deleteTelegramLinkByUserId(
  userId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("telegram_links")
    .delete()
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
}

export async function updateTelegramPrefs(
  userId: string,
  prefs: TelegramNotificationPrefs,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("telegram_links")
    .update(prefs)
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
}