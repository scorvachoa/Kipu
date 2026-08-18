import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateCardSchema } from "@/lib/validation/cards";
import { error, json } from "@/lib/http";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/cards/[id]">,
) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }
  const { id } = await context.params;
  if (!id) {
    return error("Falta el id de la tarjeta", 422);
  }
  const body = await request.json().catch(() => null);
  const parsed = updateCardSchema.safeParse(body);
  if (!parsed.success) {
    return error("Datos de tarjeta inválidos", 422);
  }
  const supabase = await createClient();
  const { data, error: dbError } = await supabase
    .from("cards")
    .update(parsed.data)
    .eq("user_id", user.id)
    .eq("id", id)
    .select()
    .single();
  if (dbError) {
    console.error("PATCH /api/cards/[id]:", dbError.message);
    return error("Error al actualizar la tarjeta", 500);
  }
  return json(data);
}