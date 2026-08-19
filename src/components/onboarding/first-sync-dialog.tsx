"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const RANGE_OPTIONS = [
  { value: "30d", label: "Últimos 30 días" },
  { value: "3m", label: "Últimos 3 meses" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "12m", label: "Últimos 12 meses" },
];

const SKIP_FLAG = "kipu:first-sync-skipped";

type SyncState = "idle" | "syncing" | "done";

function storageFlagSet(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SKIP_FLAG) !== null;
  } catch {
    return false;
  }
}

function setStorageFlag() {
  try {
    localStorage.setItem(SKIP_FLAG, "1");
  } catch {
    // sin agente de navegación completo
  }
}

export function FirstSyncDialog({
  open: initiallyOpen,
  connected,
  emailAddress,
}: {
  open: boolean;
  connected: boolean;
  emailAddress: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(
    () => initiallyOpen && !storageFlagSet(),
  );
  const [range, setRange] = useState("3m");
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function startSync() {
    setState("syncing");
    setMessage(null);
    try {
      let hasMore = true;
      let batches = 0;
      while (hasMore && batches < 100) {
        batches += 1;
        const res = await fetch("/api/gmail/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ range }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setMessage(
            res.status === 400
              ? "Conecta tu Gmail primero para poder sincronizar."
              : body?.error ?? "No se pudo sincronizar. Inténtalo de nuevo.",
          );
          setState("idle");
          return;
        }
        const body = (await res.json()) as { hasMore?: boolean };
        hasMore = body.hasMore ?? false;
      }
      try {
        sessionStorage.setItem("kipu:auto-gmail-sync-done", "1");
      } catch {
        // sin agente de navegación completo
      }
      setState("done");
      router.refresh();
    } catch {
      setMessage("Error de conexión. Inténtalo de nuevo.");
      setState("idle");
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (state === "syncing") return;
          if (!next && state === "idle") {
            setStorageFlag();
          }
          setOpen(next);
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          showCloseButton={state !== "syncing"}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {state === "done"
                ? "¡Listo!"
                : connected
                  ? "Sincroniza tus movimientos"
                  : "Conecta tu correo"}
            </DialogTitle>
            <DialogDescription>
              {state === "done"
                ? "Registramos tus movimientos. Ya puedes explorar tus finanzas."
                : connected
                  ? `Conectado con ${emailAddress}`
                  : "Conecta tu Gmail para importar automáticamente los correos de tus bancos."}
            </DialogDescription>
          </DialogHeader>

          {state === "done" ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </span>
              <p className="text-sm text-muted-foreground">
                Se importaron los movimientos de tu correo.
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  router.push("/dashboard");
                }}
              >
                Ir al resumen
              </Button>
            </div>
          ) : connected ? (
            <div className="grid gap-4">
              <div>
                <p className="mb-2 text-sm font-medium">
                  ¿Cuánto tiempo quieres importar?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        range === option.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                      onClick={() => setRange(option.value)}
                      disabled={state !== "idle"}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {message ? (
                <p className="text-sm text-red-600">{message}</p>
              ) : null}
              <Button
                onClick={startSync}
                disabled={state !== "idle"}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4" />
                Sincronizar ahora
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {message ? (
                <p className="text-sm text-red-600">{message}</p>
              ) : null}
              <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                <p className="font-medium">Importación automática</p>
                <p className="mt-1 text-muted-foreground">
                  Kipu leerá los correos de bancos (BCP, Interbank, BBVA, etc.)
                  para registrar tus gastos y pagos sin escribir nada.
                </p>
              </div>
              <Button asChild className="w-full">
                <a href="/api/gmail/connect">
                  <Mail className="h-4 w-4" />
                  Conectar con Gmail
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {state === "syncing" ? (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 overflow-hidden bg-background/95 backdrop-blur-sm">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-transparent border-primary" />
            <div className="absolute inset-7 flex items-center justify-center">
              <span className="animate-pulse text-primary">
                <RefreshCw className="h-6 w-6" />
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">
              Sincronizando tus movimientos…
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Esto puede tomar unos segundos. No cierres la pestaña.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}