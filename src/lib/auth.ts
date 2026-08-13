import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function getOptionalUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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