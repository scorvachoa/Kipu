"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, User as UserIcon, Plus, Trash2, Send } from "lucide-react";
import { formatLastSync } from "@/lib/format";
import type {
  GmailConnectionStatus,
  Person,
  TelegramConnectionStatus,
} from "@/lib/supabase/queries";
import { SyncButton } from "@/components/dashboard/sync-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [personName, setPersonName] = useState("");
  const [personType, setPersonType] = useState("family");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [disconnectingTelegram, setDisconnectingTelegram] = useState(false);

  async function addPerson(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: personName, type: personType }),
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(body.error ?? "No se pudo guardar la persona.");
      setSubmitting(false);
      return;
    }
    setPersonName("");
    setSubmitting(false);
    router.refresh();
  }

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
            Dueños de tarjetas (tú o familiares) para atribuir gastos
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
                      {person.type}
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
              Aún no hay personas. Agrega una para asignar dueños a tus tarjetas.
            </p>
          )}
          <form onSubmit={addPerson} className="flex flex-wrap gap-2">
            <Input
              className="max-w-[200px]"
              placeholder="Nombre de la persona"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              required
            />
            <Select value={personType} onValueChange={setPersonType}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Familia</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={submitting}>
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </form>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}