import { getUser } from "@/lib/auth";
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
} from "@/lib/gmail/query";
import { error, json } from "@/lib/http";
import { runSync } from "@/lib/email/sync";
import type { SyncRange } from "@/lib/gmail/query";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }

  let range: SyncRange = DEFAULT_SYNC_RANGE;
  let explicitRange: SyncRange | undefined;
  try {
    const body = (await request.json()) as { range?: unknown };
    if (isSyncRange(body.range)) {
      explicitRange = body.range;
      range = body.range;
    }
  } catch {
  }

  const connection = await getGmailConnection(user.id);
  if (!connection || connection.revoked_at) {
    return error("Gmail no conectado", 400);
  }

  const refreshToken = decryptToken(connection.refresh_token_encrypted);

  const since = explicitRange
    ? new Date(Date.now() - rangeToDays(explicitRange) * DAY_MS)
    : connection.last_sync_at
      ? new Date(new Date(connection.last_sync_at).getTime() - DAY_MS)
      : new Date(Date.now() - rangeToDays(range) * DAY_MS);

  const provider = createGmailEmailsProvider({
    refreshToken,
    query: buildGmailQuery(since),
  });

  const admin = createAdminClient();
  const repository = createTransactionRepository(admin, user.id);

  const outcome = await runSync({
    userId: user.id,
    repository,
    provider,
  });

  try {
    await updateLastSyncAt(user.id);
    await logSync(admin, user.id, outcome);
  } catch {
  }

  return json({
    emailsFound: outcome.emailsFound,
    emailsProcessed: outcome.emailsProcessed,
    transactionsCreated: outcome.transactionsCreated,
    duplicatesFound: outcome.duplicatesFound,
    requiresReview: outcome.requiresReview,
    errors: outcome.errors,
  });
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