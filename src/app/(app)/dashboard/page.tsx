import { requireUserOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getMonthSummaryRows,
  getGmailConnection,
} from "@/lib/supabase/queries";
import {
  aggregateMonthSummary,
  aggregateMonthlyTrend,
  currentMonthKey,
  isValidMonthKey,
  previousMonthKeys,
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
  const monthKeys = previousMonthKeys(monthKey, 6);

  const [summaries, gmail] = await Promise.all([
    Promise.all(
      monthKeys.map(async (key) => {
        const rows = await getMonthSummaryRows(supabase, user.id, key);
        return aggregateMonthSummary(rows, key);
      }),
    ),
    getGmailConnection(user.id),
  ]);

  const summary = summaries[0];
  const trend = aggregateMonthlyTrend(summaries);

  return (
    <DashboardView
      summary={summary}
      trend={trend}
      gmail={gmail}
      monthKey={monthKey}
      monthOptions={monthOptions()}
    />
  );
}