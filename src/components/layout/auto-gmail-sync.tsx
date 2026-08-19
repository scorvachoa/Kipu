"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const FLAG = "kipu:auto-gmail-sync-done";
const MAX_BATCHES = 50;

/** Sincroniza Gmail en segundo plano una vez por sesión al entrar a la app. */
export function AutoGmailSync() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    try {
      if (sessionStorage.getItem(FLAG)) return;
    } catch {
      // Sin agente de navegación completo (prerender): no sincronizar aquí.
      return;
    }

    void (async () => {
      let hasMore = true;
      let batches = 0;
      try {
        while (hasMore && batches < MAX_BATCHES) {
          batches += 1;
          const res = await fetch("/api/gmail/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fromLastSync: true }),
          });
          if (!res.ok) break;
          const body = (await res.json()) as { hasMore?: boolean };
          hasMore = body.hasMore ?? false;
        }
      } catch {
        // Sincronización silenciosa: no romper la navegación.
      } finally {
        try {
          sessionStorage.setItem(FLAG, "1");
        } catch {
          // ignorar
        }
        if (!cancelled) {
          router.refresh();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}