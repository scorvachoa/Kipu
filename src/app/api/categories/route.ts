import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createCategorySchema } from "@/lib/validation/categories";
import { error, json } from "@/lib/http";

const DEFAULT_ACTIVE = true;

export async function GET() {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }
  const supabase = await createClient();
  const { data, error: dbError } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", DEFAULT_ACTIVE)
    .order("name", { ascending: true });
  if (dbError) {
    console.error("GET /api/categories:", dbError.message);
    return error("Error al listar categorías", 500);
  }
  return json(data ?? []);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return error("Datos de categoría inválidos", 422);
  }
  const supabase = await createClient();
  const { data, error: dbError } = await supabase
    .from("categories")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();
  if (dbError) {
    console.error("POST /api/categories:", dbError.message);
    return error("Error al crear la categoría", 500);
  }
  return json(data, 201);
}