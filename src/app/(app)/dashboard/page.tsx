import { requireUserOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getMonthSummaryRows,
  getGmailConnection,
} from "@/lib/supabase/queries";
import {
  aggregateMonthSummary,
  currentMonthKey,
  isValidMonthKey,
} from "@/lib/finance/summary";
import { monthOptions } from "@/lib/format";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const user = await requireUserOrRedirect();
  const supabase = await createClient();

  const monthKey = isValidMonthKey(month) ? month : currentMonthKey();
  const [rows, gmail] = await Promise.all([
    getMonthSummaryRows(supabase, user.id, monthKey),
    getGmailConnection(supabase, user.id),
  ]);

  const summary = aggregateMonthSummary(rows, monthKey);

  return (
    <DashboardView
      summary={summary}
      gmail={gmail}
      monthKey={monthKey}
      monthOptions={monthOptions()}
    />
  );
}