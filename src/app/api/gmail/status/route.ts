import { getUser } from "@/lib/auth";
import { error, json } from "@/lib/http";
import { getGmailConnection } from "@/lib/supabase/gmail-adapter";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }
  const connection = await getGmailConnection(user.id);

  if (!connection || connection.revoked_at) {
    return json({ connected: false });
  }

  return json({
    connected: true,
    email: connection.email_address,
    lastSyncAt: connection.last_sync_at,
  });
}