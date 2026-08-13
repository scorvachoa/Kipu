import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GmailConnection } from "@/types/gmail";

const STATE_TTL_MS = 10 * 60 * 1000;

export async function createOAuthState(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const admin = createAdminClient();
  const { error } = await admin.from("oauth_states").insert({
    token,
    user_id: userId,
    expires_at: new Date(Date.now() + STATE_TTL_MS).toISOString(),
  } as never);
  if (error) {
    throw error;
  }
  return token;
}

export async function consumeOAuthState(
  token: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("oauth_states")
    .select("user_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (error) {
    throw error;
  }

  await admin.from("oauth_states").delete().eq("token", token);

  if (!data || new Date(data.expires_at) <= new Date()) {
    return null;
  }
  return data.user_id;
}

export interface SaveGmailConnectionInput {
  emailAddress: string | null;
  scope: string;
  refreshTokenEncrypted: string;
}

export async function saveGmailConnection(
  userId: string,
  input: SaveGmailConnectionInput,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("gmail_connections").upsert(
    {
      user_id: userId,
      email_address: input.emailAddress,
      scope: input.scope,
      refresh_token_encrypted: input.refreshTokenEncrypted,
      revoked_at: null,
    } as never,
    { onConflict: "user_id" },
  );
  if (error) {
    throw error;
  }
}

export async function getGmailConnection(
  userId: string,
): Promise<GmailConnection | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("gmail_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data as GmailConnection | null) ?? null;
}

export async function deleteGmailConnection(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("gmail_connections")
    .delete()
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
}

export async function updateLastSyncAt(
  userId: string,
  when: Date = new Date(),
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("gmail_connections")
    .update({ last_sync_at: when.toISOString() })
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
}