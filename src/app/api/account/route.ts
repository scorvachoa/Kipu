import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { error, json } from "@/lib/http";

export async function DELETE() {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }
  const admin = createAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("DELETE /api/account:", deleteError.message);
    return error("No se pudo eliminar la cuenta. Inténtalo de nuevo.", 500);
  }
  return json({ ok: true });
}