import { getUser } from "@/lib/auth";
import { error, json } from "@/lib/http";
import {
  GmailNotConnectedError,
  normalizeRange,
  syncUserGmail,
} from "@/lib/gmail/sync-service";
import { rateLimit } from "@/lib/security/rate-limit";

export const maxDuration = 60;

const SYNC_WINDOW_MS = 60 * 1000;
const SYNC_MAX_PER_WINDOW = 10;
const MAX_BATCHES_PER_REQUEST = 200;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }

  const limited = rateLimit(`gmail-sync:${user.id}`, {
    limit: SYNC_MAX_PER_WINDOW,
    windowMs: SYNC_WINDOW_MS,
  });
  if (!limited.allowed) {
    return error(
      "Demasiadas solicitudes de sincronización. Intenta de nuevo en un momento.",
      429,
    );
  }

  let body: { range?: unknown; fromLastSync?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
  }

  const fromLastSync = body.fromLastSync === true;
  const explicitRange = normalizeRange(
    fromLastSync ? undefined : body.range,
  );

  try {
    const totals = {
      emailsFound: 0,
      emailsProcessed: 0,
      transactionsCreated: 0,
      duplicatesFound: 0,
      requiresReview: 0,
      errors: 0,
      hasMore: false,
    };

    let batches = 0;
    let hasMore = true;
    while (hasMore && batches < MAX_BATCHES_PER_REQUEST) {
      const outcome = await syncUserGmail(user.id, explicitRange, {
        fromLastSync,
      });
      totals.emailsFound += outcome.emailsFound;
      totals.emailsProcessed += outcome.emailsProcessed;
      totals.transactionsCreated += outcome.transactionsCreated;
      totals.duplicatesFound += outcome.duplicatesFound;
      totals.requiresReview += outcome.requiresReview;
      totals.errors += outcome.errors;
      hasMore = outcome.hasMore;
      batches += 1;
    }
    totals.hasMore = hasMore;

    return json(totals);
  } catch (err) {
    if (err instanceof GmailNotConnectedError) {
      return error("Gmail no conectado", 400);
    }
    return error("No se pudo sincronizar", 500);
  }
}