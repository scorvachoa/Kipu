import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function getOptionalUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    // Sesión inválida/revocada (ej. refresh token que ya no existe):
    // limpia las cookies para evitar el bucle de refresh + rate-limit.
    await supabase.auth.signOut().catch(() => {});
    return null;
  }
  return user;
}

/** Para páginas: redirige a /login en lugar de lanzar (sin ruido de error en dev). */
export async function requireUserOrRedirect(): Promise<User> {
  const user = await getOptionalUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** Para route handlers: devuelve null si no hay sesión (el llamador responde 401). */
export async function getUser(): Promise<User | null> {
  return getOptionalUser();
}