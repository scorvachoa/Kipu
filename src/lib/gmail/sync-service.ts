import { decryptToken } from "@/lib/security/tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTransactionRepository } from "@/lib/supabase/transaction-repository";
import {
  clearSyncCursor,
  getGmailConnection,
  saveSyncCursor,
  updateLastSyncAt,
} from "@/lib/supabase/gmail-adapter";
import {
  createGmailEmailsProvider,
} from "@/lib/gmail/provider";
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
import type { GmailConnection } from "@/types/gmail";

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 30;

export class GmailNotConnectedError extends Error {
  constructor() {
    super("Gmail no conectado");
    this.name = "GmailNotConnectedError";
  }
}

function computeSince(connection: GmailConnection, range?: SyncRange): Date {
  if (range) {
    return new Date(Date.now() - rangeToDays(range) * DAY_MS);
  }
  if (connection.last_sync_at) {
    return new Date(new Date(connection.last_sync_at).getTime() - DAY_MS);
  }
  return new Date(Date.now() - rangeToDays(DEFAULT_SYNC_RANGE) * DAY_MS);
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

  const storedRange = connection.sync_range ?? null;
  const resume =
    Boolean(connection.sync_cursor && connection.sync_since) &&
    (range === undefined || storedRange === null || storedRange === range);

  if (!resume && connection.sync_cursor) {
    await clearSyncCursor(userId);
  }

  const since = resume
    ? new Date(connection.sync_since!)
    : computeSince(connection, range);
  const rangeKey = resume
    ? (connection.sync_range ?? range ?? "incremental")
    : range ?? "incremental";

  const query = buildGmailQuery(since);

  const provider = createGmailEmailsProvider({
    refreshToken,
    query,
    maxResults: BATCH_SIZE,
    pageToken: connection.sync_cursor ?? undefined,
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

  const nextPageToken = provider.nextPageToken;
  if (nextPageToken) {
    await saveSyncCursor(userId, {
      cursor: nextPageToken,
      since,
      range: rangeKey,
    });
    outcome.hasMore = true;
    return outcome;
  }

  await clearSyncCursor(userId);
  outcome.hasMore = false;

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