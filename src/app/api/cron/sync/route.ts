import { json } from "@/lib/http";
import {
  listActiveGmailUserIds,
} from "@/lib/supabase/gmail-adapter";
import { syncUserGmail } from "@/lib/gmail/sync-service";

export const maxDuration = 60;

function isVercelCron(request: Request): boolean {
  const agent = request.headers.get("user-agent") ?? "";
  return agent.includes("vercel-cron");
}

export async function GET(request: Request) {
  if (!isVercelCron(request)) {
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