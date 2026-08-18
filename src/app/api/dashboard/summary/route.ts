import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  aggregateMonthSummary,
  currentMonthKey,
  isValidMonthKey,
} from "@/lib/finance/summary";
import { getMonthSummaryRows } from "@/lib/supabase/queries";
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
  const { data, dbError } = await getMonthSummaryRowsSafe(supabase, user.id, monthKey);
  if (dbError) {
    console.error("GET /api/dashboard/summary:", dbError);
    return error("Error al consultar el resumen", 500);
  }
  return json(aggregateMonthSummary(data, monthKey));
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

async function getMonthSummaryRowsSafe(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthKey: string,
): Promise<{ data: Awaited<ReturnType<typeof getMonthSummaryRows>>; dbError: string | null }> {
  try {
    const data = await getMonthSummaryRows(supabase, userId, monthKey);
    return { data, dbError: null };
  } catch (err) {
    return {
      data: [],
      dbError: err instanceof Error ? err.message : "Error al consultar",
    };
  }
}