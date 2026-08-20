"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GoogleIcon } from "@/components/auth/google-icon";

type Mode = "login" | "register";

function friendlyAuthError(message: string): string {
  const msg = (message ?? "").toLowerCase();
  if (
    msg.includes("missing email or phone") ||
    msg.includes("email missing") ||
    msg.includes("a valid email address is required") ||
    msg.includes("invalid format") ||
    msg.includes("invalid email")
  ) {
    return "Ingresa un correo válido para continuar.";
  }
  if (msg.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (msg.includes("email not confirmed") || msg.includes("email not verified")) {
    return "Tu correo aún no está confirmado. Revisa tu bandeja de entrada.";
  }
  if (msg.includes("already registered") || msg.includes("user already registered")) {
    return "Ya existe una cuenta con ese correo. Inicia sesión.";
  }
  if (
    msg.includes("password should be") ||
    msg.includes("at least 6 characters") ||
    msg.includes("password is too short")
  ) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (
    msg.includes("too many requests") ||
    msg.includes("once every 60 seconds") ||
    msg.includes("rate limit") ||
    msg.includes("request was throttled")
  ) {
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  }
  if (msg.includes("invalid jwt") || msg.includes("token has expired")) {
    return "Tu sesión expiró. Inicia sesión de nuevo.";
  }
  if (msg.includes("network") || msg.includes("failed to fetch")) {
    return "Error de conexión. Inténtalo de nuevo.";
  }
  if (msg.includes("new password should be different")) {
    return "La nueva contraseña debe ser diferente de la anterior.";
  }
  return "No se pudo completar la acción. Inténtalo de nuevo.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const initialMode: Mode =
    searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "reset-link"
      ? "El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo."
      : null,
  );
  const [notice, setNotice] = useState<string | null>(
    searchParams.get("reset") === "ok"
      ? "Contraseña actualizada. Inicia sesión con tu nueva contraseña."
      : null,
  );

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Ingresa tu correo para continuar.");
      setLoading(false);
      return;
    }
    if (!password) {
      setError("Ingresa tu contraseña.");
      setLoading(false);
      return;
    }

    if (mode === "register" && password !== passwordConfirm) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) {
        setError(friendlyAuthError(signInError.message));
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (signUpError) {
      setError(friendlyAuthError(signUpError.message));
      setLoading(false);
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setNotice(
      "Revisa tu correo para confirmar la cuenta y luego inicia sesión.",
    );
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setLoading(false);
    setMode("login");
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError(friendlyAuthError(oauthError.message));
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Kipu</CardTitle>
        <CardDescription>
          {isRegister
            ? "Crea tu cuenta para gestionar tus gastos"
            : "Inicia sesión para gestionar tus gastos"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePassword} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete={
                isRegister ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isRegister ? 6 : undefined}
            />
          </div>
          {isRegister ? (
            <div className="grid gap-2">
              <Label htmlFor="password-confirm">Confirmar contraseña</Label>
              <Input
                id="password-confirm"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          )}
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {notice ? (
            <Alert>
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading
              ? "Procesando…"
              : isRegister
                ? "Crear cuenta"
                : "Ingresar"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          o continúa con
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-center gap-2.5 rounded-xl text-[0.95rem] font-medium shadow-sm transition-all hover:shadow-md sm:h-11"
          disabled={loading}
          onClick={handleGoogle}
        >
          <GoogleIcon className="size-5 shrink-0" />
          Continuar con Google
        </Button>

        <p className="mt-4 text-center text-sm">
          {isRegister ? (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                className="font-medium underline"
                onClick={() => switchMode("login")}
              >
                Inicia sesión
              </button>
            </>
          ) : (
            <>
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                className="font-medium underline"
                onClick={() => switchMode("register")}
              >
                Regístrate
              </button>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}