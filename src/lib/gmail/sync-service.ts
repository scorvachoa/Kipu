import { decryptToken } from "@/lib/security/tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTransactionRepository } from "@/lib/supabase/transaction-repository";
import {
  getGmailConnection,
  updateLastSyncAt,
} from "@/lib/supabase/gmail-adapter";
import { createGmailEmailsProvider } from "@/lib/gmail/provider";
import {
  buildGmailQuery,
  DEFAULT_SYNC_RANGE,
  isSyncRange,
  rangeToDays,
  type SyncRange,
} from "@/lib/gmail/query";
import { runSync } from "@/lib/email/sync";
import type { SyncOutcome } from "@/lib/email/sync";
import { createCategoryService } from "@/lib/ai";
import { notifyNewTransactions } from "@/lib/telegram/notifications";

const DAY_MS = 24 * 60 * 60 * 1000;

export class GmailNotConnectedError extends Error {
  constructor() {
    super("Gmail no conectado");
    this.name = "GmailNotConnectedError";
  }
}

export class GmailSyncConfiguredError extends Error {
  constructor() {
    super("Gmail sincronización no configurada");
    this.name = "GmailSyncConfiguredError";
  }
}

export async function syncUserGmail(
  userId: string,
  range?: SyncRange,
): Promise<SyncOutcome> {
  const connection = await getGmailConnection(userId);
  if (!connection || connection.revoked_at) {
    throw new GmailNotConnectedError();
  }

  const refreshToken = decryptToken(connection.refresh_token_encrypted);

  const since = range
    ? new Date(Date.now() - rangeToDays(range) * DAY_MS)
    : connection.last_sync_at
      ? new Date(new Date(connection.last_sync_at).getTime() - DAY_MS)
      : new Date(Date.now() - rangeToDays(DEFAULT_SYNC_RANGE) * DAY_MS);

  const provider = createGmailEmailsProvider({
    refreshToken,
    query: buildGmailQuery(since),
  });

  const admin = createAdminClient();
  const repository = createTransactionRepository(admin, userId);
  const categoryService = createCategoryService();

  const outcome = await runSync({
    userId,
    repository,
    provider,
    categoryService,
  });

  try {
    await updateLastSyncAt(userId);
    await logSync(admin, userId, outcome);
    await notifyNewTransactions(userId, outcome.createdTransactions);
  } catch {
  }

  return outcome;
}

async function logSync(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  outcome: {
    emailsFound: number;
    emailsProcessed: number;
    transactionsCreated: number;
    duplicatesFound: number;
    requiresReview: number;
    errors: number;
  },
) {
  await admin.from("sync_logs").insert({
    user_id: userId,
    status: "completed",
    emails_found: outcome.emailsFound,
    emails_processed: outcome.emailsProcessed,
    transactions_created: outcome.transactionsCreated,
    duplicates_found: outcome.duplicatesFound,
    requires_review: outcome.requiresReview,
    errors: outcome.errors,
    finished_at: new Date().toISOString(),
  } as never);
}

export function normalizeRange(value: unknown): SyncRange | undefined {
  return isSyncRange(value) ? value : undefined;
}