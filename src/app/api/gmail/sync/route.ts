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

  try {
    const outcome = await syncUserGmail(user.id, normalizeRange(fromLastSync ? undefined : body.range), {
      fromLastSync,
    });
    return json({
      emailsFound: outcome.emailsFound,
      emailsProcessed: outcome.emailsProcessed,
      transactionsCreated: outcome.transactionsCreated,
      duplicatesFound: outcome.duplicatesFound,
      requiresReview: outcome.requiresReview,
      errors: outcome.errors,
      hasMore: outcome.hasMore,
    });
  } catch (err) {
    if (err instanceof GmailNotConnectedError) {
      return error("Gmail no conectado", 400);
    }
    return error("No se pudo sincronizar", 500);
  }
}