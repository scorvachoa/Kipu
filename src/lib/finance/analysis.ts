import type { SummaryTx } from "@/lib/finance/summary";

export type { SummaryTx } from "@/lib/finance/summary";

export interface AnomalyResult {
  transactionId: string;
  merchant: string | null;
  amount: number;
  currency: string;
  transactionDate: string;
  categoryName: string | null;
  merchantAverage: number | null;
  merchantMultiplier: number | null;
  categoryAverage: number | null;
  severity: "medium" | "high";
}

export interface SubscriptionResult {
  merchant: string;
  amounts: number[];
  avgAmount: number;
  occurrences: number;
  monthsActive: number;
  lastDate: string | null;
}

const EXPENSE_TYPES = new Set(["purchase", "withdrawal", "fee", "other"]);
const MERCHANT_MAX_DIFF_RATIO = 0.2;
const RECURRING_MIN_OCCURRENCES = 2;

function isExpense(tx: SummaryTx): boolean {
  return EXPENSE_TYPES.has(tx.transaction_type);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface AnomalyDetectionOptions {
  merchantFactor?: number;
  categoryFactor?: number;
}

export function detectAnomalies(
  transactions: SummaryTx[],
  options: AnomalyDetectionOptions = {},
): AnomalyResult[] {
  const merchantFactor = options.merchantFactor ?? 2;
  const categoryFactor = options.categoryFactor ?? 3;

  const expenses = transactions.filter(isExpense);
  const categoryMap = new Map<string, number[]>();
  for (const tx of expenses) {
    const name = tx.categories?.name;
    if (!name) continue;
    const list = categoryMap.get(name) ?? [];
    list.push(tx.amount);
    categoryMap.set(name, list);
  }

  const results: AnomalyResult[] = [];
  for (const tx of expenses) {
    if (tx.merchant) {
      const others = expenses.filter(
        (other) =>
          other.id !== tx.id &&
          other.merchant !== null &&
          other.merchant.toUpperCase() === tx.merchant!.toUpperCase(),
      );
      if (others.length >= 2) {
        const avg =
          others.reduce((acc, other) => acc + other.amount, 0) / others.length;
        if (avg > 0 && tx.amount > avg * merchantFactor) {
          const multiplier = tx.amount / avg;
          results.push({
            transactionId: tx.id,
            merchant: tx.merchant,
            amount: tx.amount,
            currency: tx.currency,
            transactionDate: tx.transaction_date,
            categoryName: tx.categories?.name ?? null,
            merchantAverage: round2(avg),
            merchantMultiplier: round2(multiplier),
            categoryAverage: null,
            severity: multiplier >= merchantFactor * 1.5 ? "high" : "medium",
          });
          continue;
        }
      }
    }

    const categoryName = tx.categories?.name;
    if (!categoryName) continue;
    const categoryAmounts = categoryMap.get(categoryName) ?? [];
    const previousCount = categoryAmounts.length - 1;
    if (previousCount < 3) continue;
    const previousTotal = categoryAmounts.reduce((acc, amount) => acc + amount, 0) - tx.amount;
    const avg = previousTotal / previousCount;
    if (avg > 0 && tx.amount > avg * categoryFactor) {
      results.push({
        transactionId: tx.id,
        merchant: tx.merchant,
        amount: tx.amount,
        currency: tx.currency,
        transactionDate: tx.transaction_date,
        categoryName,
        merchantAverage: null,
        merchantMultiplier: null,
        categoryAverage: round2(avg),
        severity: "medium",
      });
    }
  }

  return results;
}

export function detectSubscriptions(
  transactions: SummaryTx[],
): SubscriptionResult[] {
  const byMerchant = new Map<string, SummaryTx[]>();
  const monthsActive = new Map<string, Set<string>>();

  for (const tx of transactions) {
    if (!isExpense(tx) || !tx.merchant) {
      continue;
    }
    const key = tx.merchant.toUpperCase();
    const list = byMerchant.get(key) ?? [];
    list.push(tx);
    byMerchant.set(key, list);

    const month = tx.transaction_date.slice(0, 7);
    const active = monthsActive.get(key) ?? new Set<string>();
    active.add(month);
    monthsActive.set(key, active);
  }

  const results: SubscriptionResult[] = [];
  for (const [key, list] of byMerchant) {
    if (list.length < RECURRING_MIN_OCCURRENCES) {
      continue;
    }
    const active = monthsActive.get(key) ?? new Set<string>();
    const sorted = [...list].sort((a, b) =>
      a.transaction_date.localeCompare(b.transaction_date),
    );
    const avg =
      list.reduce((acc, tx) => acc + tx.amount, 0) / list.length;
    const consistent = list.every(
      (tx) => Math.abs(tx.amount - avg) / avg < MERCHANT_MAX_DIFF_RATIO,
    );
    if (!consistent) {
      continue;
    }
    results.push({
      merchant: key,
      amounts: list.map((tx) => tx.amount),
      avgAmount: round2(avg),
      occurrences: list.length,
      monthsActive: active.size,
      lastDate: sorted[sorted.length - 1].transaction_date,
    });
  }

  return results.sort(
    (a, b) => b.avgAmount - a.avgAmount || b.monthsActive - a.monthsActive,
  );
}

export interface ForecastInput {
  spentSoFar: number;
  daysElapsed: number;
  daysInMonth: number;
  averageDailyPastMonths: number;
}

export function forecastMonthlyTotal(input: ForecastInput): {
  projected: number;
  pacePerDay: number;
} {
  const { spentSoFar, daysElapsed, daysInMonth, averageDailyPastMonths } = input;
  const todayPace = daysElapsed > 0 ? spentSoFar / daysElapsed : 0;
  const pacePerDay =
    averageDailyPastMonths > 0
      ? (todayPace + averageDailyPastMonths) / 2
      : todayPace;
  const remainingDays = Math.max(daysInMonth - daysElapsed, 0);
  const projected = round2(spentSoFar + pacePerDay * remainingDays);
  return { projected, pacePerDay: round2(pacePerDay) };
}