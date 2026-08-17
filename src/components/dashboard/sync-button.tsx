"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SyncButton({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [range, setRange] = useState<string>("incremental");

  if (!connected) {
    return (
      <Button asChild variant="outline">
        <Link href="/settings">
          <Mail className="h-4 w-4" />
          Conectar Gmail
        </Link>
      </Button>
    );
  }

  async function handleSync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          range === "incremental" ? {} : { range },
        ),
      });
      const body = (await res.json()) as {
        error?: string;
        emailsFound?: number;
        emailsProcessed?: number;
        transactionsCreated?: number;
        duplicatesFound?: number;
        errors?: number;
      };
      if (!res.ok) {
        setMessage(body.error ?? "No se pudo sincronizar.");
        return;
      }
      const parts = [
        `${body.emailsFound ?? 0} correos`,
        `${body.transactionsCreated ?? 0} nuevos`,
        `${body.duplicatesFound ?? 0} duplicados`,
      ];
      if ((body.errors ?? 0) > 0) {
        parts.push(`${body.errors} con error`);
      }
      setMessage(`Sincronización completa · ${parts.join(", ")}.`);
      router.refresh();
    } catch {
      setMessage("Error de conexión al sincronizar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleSync} disabled={loading} variant="outline" className="flex-1 sm:flex-none">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading
            ? "Sincronizando…"
            : <>
                <span className="sm:hidden">Sincronizar</span>
                <span className="hidden sm:inline">Sincronizar con Gmail</span>
              </>}
        </Button>
        <select
          value={range}
          onChange={(event) => setRange(event.target.value)}
          disabled={loading}
          className="h-8 flex-1 rounded-lg border border-input bg-background px-3 text-sm sm:flex-none"
          aria-label="Rango de sincronización"
        >
          <option value="incremental">Desde última sync</option>
          <option value="30d">Últimos 30 días</option>
          <option value="3m">Últimos 3 meses</option>
          <option value="6m">Últimos 6 meses</option>
          <option value="12m">Últimos 12 meses</option>
        </select>
      </div>
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}