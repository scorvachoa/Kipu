import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateCategorySchema } from "@/lib/validation/categories";
import { error, json } from "@/lib/http";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/categories/[id]">,
) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }
  const { id } = await context.params;
  if (!id) {
    return error("Falta el id de la categoría", 422);
  }
  const body = await request.json().catch(() => null);
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return error("Datos de categoría inválidos", 422);
  }
  const supabase = await createClient();
  const { data, error: dbError } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (dbError) {
    console.error("PATCH /api/categories/[id]:", dbError.message);
    return error("Error al actualizar la categoría", 500);
  }
  return json(data);
}
