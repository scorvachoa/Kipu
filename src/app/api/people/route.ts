import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createPersonSchema } from "@/lib/validation/people";
import { error, json } from "@/lib/http";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }
  const supabase = await createClient();
  const { data, error: dbError } = await supabase
    .from("people")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (dbError) {
    console.error("GET /api/people:", dbError.message);
    return error("Error al listar personas", 500);
  }
  return json(data ?? []);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = createPersonSchema.safeParse(body);
  if (!parsed.success) {
    return error("Datos de persona inválidos", 422);
  }
  const supabase = await createClient();
  const { data, error: dbError } = await supabase
    .from("people")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();
  if (dbError) {
    console.error("POST /api/people:", dbError.message);
    return error("Error al crear la persona", 500);
  }
  return json(data, 201);
}