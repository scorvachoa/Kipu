import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { error, json } from "@/lib/http";

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/people/[id]">,
) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }
  const { id } = await context.params;
  if (!id) {
    return error("Falta el id de la persona", 422);
  }
  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("people")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (dbError) {
    return error(dbError.message, 500);
  }
  return json({ ok: true });
}