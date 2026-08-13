import { getUser } from "@/lib/auth";
import { error, json } from "@/lib/http";
import { deleteGmailConnection } from "@/lib/supabase/gmail-adapter";

export async function POST() {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }
  await deleteGmailConnection(user.id);
  return json({ ok: true });
}