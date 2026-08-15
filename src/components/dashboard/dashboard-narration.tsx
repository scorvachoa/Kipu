"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashNarration({ monthKey }: { monthKey: string }) {
  const [narracion, setNarracion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setNarracion(null);
    try {
      const response = await fetch(
        `/api/dashboard/narration?month=${encodeURIComponent(monthKey)}`,
      );
      const data = (await response.json()) as { narracion: string | null };
      setNarracion(data.narracion);
    } catch {
      setNarracion(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Resumen con IA</CardTitle>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-muted disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {narracion ? "Regenerar" : "Generar"}
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Generando resumen con IA…
          </p>
        ) : narracion ? (
          <p className="text-sm leading-relaxed">{narracion}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Pulsa Generar para obtener un resumen narrativo del mes en lenguaje
            natural.
          </p>
        )}
      </CardContent>
    </Card>
  );
}