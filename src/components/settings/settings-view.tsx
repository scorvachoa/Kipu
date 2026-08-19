"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Mail, User as UserIcon, Trash2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatLastSync } from "@/lib/format";
import type {
  GmailConnectionStatus,
  Person,
  TelegramConnectionStatus,
} from "@/lib/supabase/queries";
import { SyncButton } from "@/components/dashboard/sync-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SettingsView({
  userEmail,
  gmail,
  telegram,
  people,
}: {
  userEmail: string | null;
  gmail: GmailConnectionStatus;
  telegram: TelegramConnectionStatus;
  people: Person[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [disconnectingTelegram, setDisconnectingTelegram] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function disconnectGmail() {
    setDisconnecting(true);
    setGmailError(null);
    const res = await fetch("/api/gmail/disconnect", { method: "POST" });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setGmailError(body.error ?? "No se pudo desconectar.");
      setDisconnecting(false);
      return;
    }
    router.refresh();
  }

  async function connectTelegram() {
    setLinking(true);
    setTelegramError(null);
    const res = await fetch("/api/telegram/link", { method: "POST" });
    const body = (await res.json()) as {
      code?: string;
      bot_username?: string | null;
      error?: string;
    };
    if (!res.ok) {
      setTelegramError(body.error ?? "No se pudo generar el código.");
      setLinking(false);
      return;
    }
    setLinkCode(body.code ?? null);
    setBotUsername(body.bot_username ?? null);
    setLinking(false);
  }

  async function disconnectTelegram() {
    setDisconnectingTelegram(true);
    setTelegramError(null);
    const res = await fetch("/api/telegram/link", { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setTelegramError(body.error ?? "No se pudo desconectar.");
      setDisconnectingTelegram(false);
      return;
    }
    setLinkCode(null);
    router.refresh();
  }

  async function updateTelegramPref(key: string, value: boolean) {
    setTelegramError(null);
    const res = await fetch("/api/telegram/link", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setTelegramError(body.error ?? "No se pudieron guardar preferencias.");
      return;
    }
    router.refresh();
  }

  async function deletePerson(id: string) {
    setError(null);
    const res = await fetch(`/api/people/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "No se pudo quitar la persona.");
      return;
    }
    router.refresh();
  }

  const lastSync = formatLastSync(gmail.last_sync_at);
  const botHandle = botUsername ? `@${botUsername}` : "el bot";
  const requiredConfirm = userEmail ?? "ELIMINAR";

  async function confirmDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setDeleteError(body.error ?? "No se pudo eliminar la cuenta.");
      setDeleting(false);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut().catch(() => {});
    router.replace("/");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Tu cuenta y conexiones</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cuenta</CardTitle>
          <CardDescription>Tu sesión en Kipu</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="flex items-center gap-2 text-sm">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            {userEmail ?? "Sin correo"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gmail</CardTitle>
          <CardDescription>
            Fuente automática de tus movimientos bancarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {gmail.connected ? (
            <>
              <p className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {gmail.email_address ?? "Cuenta conectada"}
                <Badge variant="default">Conectado</Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                Última sincronización: {lastSync ?? "nunca"}
              </p>
              <div className="flex flex-wrap gap-2">
                <SyncButton connected />
                <Button
                  variant="ghost"
                  onClick={disconnectGmail}
                  disabled={disconnecting}
                >
                  {disconnecting ? "Desconectando…" : "Desconectar"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Conecta tu Gmail para importar automáticamente los correos de
                BCP e Interbank.
              </p>
              <Button asChild>
                <a href="/api/gmail/connect">
                  <Mail className="h-4 w-4" />
                  Conectar con Gmail
                </a>
              </Button>
            </>
          )}
          {gmailError ? (
            <Alert variant="destructive">
              <AlertDescription>{gmailError}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Telegram</CardTitle>
          <CardDescription>
            Consulta y notificaciones de tus movimientos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {telegram.connected ? (
            <>
              <p className="flex items-center gap-2 text-sm">
                <Send className="h-4 w-4 text-muted-foreground" />
                Vinculado
                <Badge variant="default">Conectado</Badge>
              </p>
              <label className="flex items-center justify-between gap-2 text-sm">
                Notificar nuevos gastos
                <input
                  type="checkbox"
                  checked={telegram.notify_new_expenses}
                  onChange={(e) =>
                    updateTelegramPref("notify_new_expenses", e.target.checked)
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-sm">
                Notificar pagos
                <input
                  type="checkbox"
                  checked={telegram.notify_payments}
                  onChange={(e) =>
                    updateTelegramPref("notify_payments", e.target.checked)
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-sm">
                Notificar transacciones que requieren revisión
                <input
                  type="checkbox"
                  checked={telegram.notify_needs_review}
                  onChange={(e) =>
                    updateTelegramPref(
                      "notify_needs_review",
                      e.target.checked,
                    )
                  }
                />
              </label>
              <Button
                variant="ghost"
                onClick={disconnectTelegram}
                disabled={disconnectingTelegram}
              >
                {disconnectingTelegram ? "Desconectando…" : "Desconectar"}
              </Button>
            </>
          ) : linkCode ? (
            <>
              <p className="text-sm text-muted-foreground">
                Abre {botHandle} en Telegram y envía este código:
              </p>
              <p className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
                /start {linkCode}
              </p>
              <p className="text-xs text-muted-foreground">
                El código expira en 10 minutos y solo se puede usar una vez.
              </p>
              <Button onClick={() => router.refresh()} variant="outline">
                Ya lo vinculé
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Vincula tu Telegram para recibir notificaciones y consultar tu
                resumen, gastos y tarjetas desde el chat.
              </p>
              <Button onClick={connectTelegram} disabled={linking}>
                <Send className="h-4 w-4" />
                {linking ? "Generando código…" : "Conectar Telegram"}
              </Button>
            </>
          )}
          {telegramError ? (
            <Alert variant="destructive">
              <AlertDescription>{telegramError}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personas</CardTitle>
          <CardDescription>
            Se crean automáticamente al escanear correos (según el saludo, ej.
            &quot;Hola Smith&quot;)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {people.length > 0 ? (
            <ul className="divide-y">
              {people.map((person) => (
                <li key={person.id} className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2 text-sm">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    {person.name}
                    <Badge variant="secondary" className="capitalize">
                      {person.type === "owner" ? "Dueño" : person.type}
                    </Badge>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Quitar a ${person.name}`}
                    title={`Quitar a ${person.name}`}
                    onClick={() => deletePerson(person.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no hay personas. Aparecerán automáticamente al escanear
              correos con saludos como &quot;Hola Smith&quot;.
            </p>
          )}
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Zona de peligro
          </CardTitle>
          <CardDescription>
            Eliminar tu cuenta borra todas tus transacciones, tarjetas,
            categorías, personas y conexiones de forma permanente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="destructive"
            onClick={() => {
              setDeleteConfirm("");
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar cuenta
          </Button>
          {deleteError ? (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          ) : null}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-destructive">
                  ¿Eliminar tu cuenta?
                </DialogTitle>
                <DialogDescription>
                  Esta acción es irreversible. Se borrarán todas tus
                  transacciones, tarjetas, categorías, personas y conexiones.
                  Escribe <span className="font-mono">{requiredConfirm}</span>{" "}
                  para confirmar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={requiredConfirm}
                />
                <Button
                  variant="destructive"
                  disabled={deleteConfirm !== requiredConfirm || deleting}
                  onClick={confirmDeleteAccount}
                >
                  {deleting ? "Eliminando…" : "Eliminar mi cuenta"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}