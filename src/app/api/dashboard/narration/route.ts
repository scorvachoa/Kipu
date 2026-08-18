import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  aggregateMonthSummary,
  currentMonthKey,
  isValidMonthKey,
} from "@/lib/finance/summary";
import { getMonthSummaryRows } from "@/lib/supabase/queries";
import { resumenMensualConGemini } from "@/lib/ai/month-resumen";
import { error, json } from "@/lib/http";
import { rateLimit } from "@/lib/security/rate-limit";

const NARRATION_WINDOW_MS = 60 * 60 * 1000;
const NARRATION_MAX_PER_WINDOW = 30;

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
  }

  const limited = rateLimit(`narration:${user.id}`, {
    limit: NARRATION_MAX_PER_WINDOW,
    windowMs: NARRATION_WINDOW_MS,
  });
  if (!limited.allowed) {
    return error(
      "Demasiadas solicitudes. Intenta de nuevo en un momento.",
      429,
    );
  }

  const { searchParams } = new URL(request.url);
  const monthRaw = searchParams.get("month");
  const monthKey = isValidMonthKey(monthRaw) ? monthRaw : currentMonthKey();

  const supabase = await createClient();
  const rows = await getMonthSummaryRows(supabase, user.id, monthKey).catch(
    () => [],
  );
  const summary = aggregateMonthSummary(rows, monthKey);

  const narracion = await resumenMensualConGemini(summary);
  if (!narracion) {
    return json({ narracion: null });
  }
  return json({ narracion });
}