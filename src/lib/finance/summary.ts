import { DEFAULT_CURRENCY } from "@/types/shared";

export interface SummaryCard {
  name: string;
  bank: string | null;
  last4: string | null;
  currency: string;
  total: number;
}

export interface SummaryCategory {
  name: string;
  icon: string | null;
  color: string | null;
  currency: string;
  total: number;
}

export interface LatestTransaction {
  id: string;
  merchant: string | null;
  amount: number;
  currency: string;
  transaction_type: string;
  transaction_date: string;
  transaction_time: string | null;
  category: { name: string; icon: string | null; color: string | null } | null;
  card: SummaryCard | null;
  person: { name: string } | null;
  status: string;
}

export interface MonthSummary {
  monthKey: string;
  baseCurrency: string;
  totalExpenses: number;
  totalExpensesByCurrency: Record<string, number>;
  totalIncome: number;
  totalIncomeByCurrency: Record<string, number>;
  netBalance: number;
  transactionCount: number;
  creditExpenses: number;
  creditExpensesByCurrency: Record<string, number>;
  debitExpenses: number;
  debitExpensesByCurrency: Record<string, number>;
  cardPayments: number;
  cardPaymentsByCurrency: Record<string, number>;
  categoryBreakdown: SummaryCategory[];
  cardBreakdown: SummaryCard[];
  latest: LatestTransaction[];
}

export interface SummaryTx {
  id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  payment_method: string;
  merchant: string | null;
  transaction_date: string;
  transaction_time: string | null;
  status: string;
  categories: { name: string; icon: string | null; color: string | null } | null;
  cards: { name: string; bank: string; last4: string } | null;
  people: { name: string } | null;
}

const EXPENSE_TYPES = new Set(["purchase"]);
const INCOME_TYPES = new Set(["income", "refund"]);

function isExpense(tx: SummaryTx): boolean {
  return EXPENSE_TYPES.has(tx.transaction_type);
}

function isIncome(tx: SummaryTx): boolean {
  return INCOME_TYPES.has(tx.transaction_type);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function addCurrencyTo(
  totals: Record<string, number>,
  currency: string,
  amount: number,
): void {
  const safe = currency || DEFAULT_CURRENCY;
  totals[safe] = round2((totals[safe] ?? 0) + amount);
}

function pickBaseCurrency(txList: SummaryTx[]): string {
  const counts = new Map<string, number>();
  for (const tx of txList) {
    const currency = tx.currency || DEFAULT_CURRENCY;
    counts.set(currency, (counts.get(currency) ?? 0) + 1);
  }
  if (counts.size === 0) {
    return DEFAULT_CURRENCY;
  }
  let best: string = DEFAULT_CURRENCY;
  let bestCount = -1;
  for (const [currency, count] of counts) {
    if (
      count > bestCount ||
      (count === bestCount && currency === DEFAULT_CURRENCY && best !== currency)
    ) {
      best = currency;
      bestCount = count;
    }
  }
  return best;
}

function sortTransactions(rows: SummaryTx[]): SummaryTx[] {
  return [...rows].sort((a, b) => {
    if (a.transaction_date !== b.transaction_date) {
      return b.transaction_date.localeCompare(a.transaction_date);
    }
    const aTime = a.transaction_time ?? "";
    const bTime = b.transaction_time ?? "";
    return bTime.localeCompare(aTime);
  });
}

export function aggregateMonthSummary(
  rows: SummaryTx[],
  monthKey: string,
): MonthSummary {
  const expenses = rows.filter(isExpense);
  const incomes = rows.filter(isIncome);
  const payments = rows.filter((r) => r.transaction_type === "payment");

  const baseCurrency = pickBaseCurrency([...expenses, ...incomes]);

  const totalExpensesByCurrency: Record<string, number> = {};
  const creditExpensesByCurrency: Record<string, number> = {};
  const debitExpensesByCurrency: Record<string, number> = {};
  const cardPaymentsByCurrency: Record<string, number> = {};
  const totalIncomeByCurrency: Record<string, number> = {};

  for (const tx of expenses) {
    addCurrencyTo(totalExpensesByCurrency, tx.currency, tx.amount);
    if (tx.payment_method === "credit_card") {
      addCurrencyTo(creditExpensesByCurrency, tx.currency, tx.amount);
    } else if (tx.payment_method === "debit_card") {
      addCurrencyTo(debitExpensesByCurrency, tx.currency, tx.amount);
    }
  }
  for (const tx of payments) {
    addCurrencyTo(cardPaymentsByCurrency, tx.currency, tx.amount);
  }
  for (const tx of incomes) {
    addCurrencyTo(totalIncomeByCurrency, tx.currency, tx.amount);
  }

  const categoryMap = new Map<string, SummaryCategory>();
  for (const tx of expenses) {
    const category = tx.categories;
    const name = category?.name ?? "Sin categoría";
    const key = `${name}\u0000${tx.currency || DEFAULT_CURRENCY}`;
    const current = categoryMap.get(key);
    if (current) {
      current.total = round2(current.total + tx.amount);
    } else {
      categoryMap.set(key, {
        name,
        icon: category?.icon ?? null,
        color: category?.color ?? null,
        currency: tx.currency || DEFAULT_CURRENCY,
        total: tx.amount,
      });
    }
  }

  const cardMap = new Map<string, SummaryCard>();
  for (const tx of expenses) {
    const card = tx.cards;
    const name = card?.name ?? "Sin tarjeta";
    const key = `${name}\u0000${tx.currency || DEFAULT_CURRENCY}`;
    const current = cardMap.get(key);
    if (current) {
      current.total = round2(current.total + tx.amount);
    } else {
      cardMap.set(key, {
        name,
        bank: card?.bank ?? null,
        last4: card?.last4 ?? null,
        currency: tx.currency || DEFAULT_CURRENCY,
        total: tx.amount,
      });
    }
  }

  const latest = sortTransactions(rows).slice(0, 10).map((tx) => ({
    id: tx.id,
    merchant: tx.merchant,
    amount: tx.amount,
    currency: tx.currency,
    transaction_type: tx.transaction_type,
    transaction_date: tx.transaction_date,
    transaction_time: tx.transaction_time,
    category: tx.categories
      ? {
          name: tx.categories.name,
          icon: tx.categories.icon,
          color: tx.categories.color,
        }
      : null,
    card: tx.cards
      ? {
          name: tx.cards.name,
          bank: tx.cards.bank,
          last4: tx.cards.last4,
          currency: tx.currency || DEFAULT_CURRENCY,
          total: 0,
        }
      : null,
    person: tx.people ?? null,
    status: tx.status,
  }));

  const totalExpenses = totalExpensesByCurrency[baseCurrency] ?? 0;
  const totalIncome = totalIncomeByCurrency[baseCurrency] ?? 0;

  return {
    monthKey,
    baseCurrency,
    totalExpenses: round2(totalExpenses),
    totalExpensesByCurrency,
    totalIncome: round2(totalIncome),
    totalIncomeByCurrency,
    netBalance: round2(totalIncome - totalExpenses),
    transactionCount: expenses.length,
    creditExpenses: round2(creditExpensesByCurrency[baseCurrency] ?? 0),
    creditExpensesByCurrency,
    debitExpenses: round2(debitExpensesByCurrency[baseCurrency] ?? 0),
    debitExpensesByCurrency,
    cardPayments: round2(cardPaymentsByCurrency[baseCurrency] ?? 0),
    cardPaymentsByCurrency,
    categoryBreakdown: [...categoryMap.values()].sort((a, b) => {
      const diff = b.total - a.total;
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    }),
    cardBreakdown: [...cardMap.values()].sort((a, b) => {
      const diff = b.total - a.total;
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    }),
    latest,
  };
}

export function monthKeyToRange(monthKey: string): { gte: string; lt: string } {
  const [year, month] = monthKey.split("-");
  const y = Number(year);
  const m = Number(month);
  const next = new Date(y, m, 1);
  const lt = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
  return { gte: `${year}-${month}-01`, lt };
}

export function isValidMonthKey(value: string | undefined | null): value is string {
  if (!value) return false;
  return /^\d{4}-\d{2}$/.test(value);
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
}

export function previousMonthKeys(monthKey: string, count = 6): string[] {
  const [year, month] = monthKey.split("-").map(Number);
  if (Number.isNaN(year) || Number.isNaN(month)) {
    throw new Error(`Clave de mes inválida: ${monthKey}`);
  }
  const keys: string[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(year, month - 1 - i, 1);
    keys.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return keys;
}

export interface MonthlyTrendPoint {
  monthKey: string;
  total: number;
  currency: string;
}

export function aggregateMonthlyTrend(
  summaries: MonthSummary[],
): MonthlyTrendPoint[] {
  return summaries
    .map((summary) => ({
      monthKey: summary.monthKey,
      total: summary.totalExpenses,
      currency: summary.baseCurrency,
    }))
    .reverse();
}