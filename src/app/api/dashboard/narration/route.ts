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

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return error("No autorizado", 401);
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