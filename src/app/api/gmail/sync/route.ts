import { getUser } from "@/lib/auth";
import { error, json } from "@/lib/http";
import {
  GmailNotConnectedError,
  normalizeRange,
  syncUserGmail,
} from "@/lib/gmail/sync-service";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }

  let explicitRange: unknown;
  try {
    const body = (await request.json()) as { range?: unknown };
    explicitRange = body.range;
  } catch {
  }

  try {
    const outcome = await syncUserGmail(user.id, normalizeRange(explicitRange));
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