import { json } from "@/lib/http";
import {
  listActiveGmailUserIds,
} from "@/lib/supabase/gmail-adapter";
import { syncUserGmail } from "@/lib/gmail/sync-service";
import { timingSafeEqual } from "node:crypto";

export const maxDuration = 60;

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return false;
  }
  const expected = Buffer.from(secret);
  const provided = Buffer.from(token);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return json({ ok: false, error: "No autorizado" }, 401);
  }

  const userIds = await listActiveGmailUserIds();
  const results: Array<{
    userId: string;
    ok: boolean;
    transactionsCreated?: number;
    error?: string;
  }> = [];

  for (const userId of userIds) {
    try {
      const outcome = await syncUserGmail(userId);
      results.push({
        userId,
        ok: true,
        transactionsCreated: outcome.transactionsCreated,
      });
    } catch {
      results.push({ userId, ok: false, error: "sync failed" });
    }
  }

  return json({ ok: true, synchronizedUsers: results.length, results });
}