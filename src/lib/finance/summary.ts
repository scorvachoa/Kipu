export interface SummaryCard {
  name: string;
  bank: string | null;
  last4: string | null;
  total: number;
}

export interface SummaryCategory {
  name: string;
  icon: string | null;
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
  category: { name: string; icon: string | null } | null;
  card: SummaryCard | null;
  person: { name: string } | null;
  status: string;
}

export interface MonthSummary {
  monthKey: string;
  totalExpenses: number;
  transactionCount: number;
  creditExpenses: number;
  debitExpenses: number;
  cardPayments: number;
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
  categories: { name: string; icon: string | null } | null;
  cards: { name: string; bank: string; last4: string } | null;
  people: { name: string } | null;
}

const EXPENSE_TYPES = new Set(["purchase"]);

function isExpense(tx: SummaryTx): boolean {
  return EXPENSE_TYPES.has(tx.transaction_type);
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

export function aggregateMonthSummary(rows: SummaryTx[], monthKey: string): MonthSummary {
  const expenses = rows.filter(isExpense);
  const payments = rows.filter((r) => r.transaction_type === "payment");

  const categoryMap = new Map<string, SummaryCategory>();
  for (const tx of expenses) {
    const category = tx.categories;
    const name = category?.name ?? "Sin categoría";
    const current = categoryMap.get(name);
    if (current) {
      current.total += tx.amount;
    } else {
      categoryMap.set(name, { name, icon: category?.icon ?? null, total: tx.amount });
    }
  }

  const cardMap = new Map<string, SummaryCard>();
  for (const tx of expenses) {
    const card = tx.cards;
    const name = card?.name ?? "Sin tarjeta";
    const current = cardMap.get(name);
    if (current) {
      current.total += tx.amount;
    } else {
      cardMap.set(name, {
        name,
        bank: card?.bank ?? null,
        last4: card?.last4 ?? null,
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
    category: tx.categories ? { name: tx.categories.name, icon: tx.categories.icon } : null,
    card: tx.cards
      ? { name: tx.cards.name, bank: tx.cards.bank, last4: tx.cards.last4, total: 0 }
      : null,
    person: tx.people ?? null,
    status: tx.status,
  }));

  return {
    monthKey,
    totalExpenses: round2(
      expenses.reduce((acc, tx) => acc + tx.amount, 0),
    ),
    transactionCount: expenses.length,
    creditExpenses: round2(
      expenses.filter((tx) => tx.payment_method === "credit_card").reduce((a, t) => a + t.amount, 0),
    ),
    debitExpenses: round2(
      expenses.filter((tx) => tx.payment_method === "debit_card").reduce((a, t) => a + t.amount, 0),
    ),
    cardPayments: round2(payments.reduce((acc, tx) => acc + tx.amount, 0)),
    categoryBreakdown: [...categoryMap.values()].sort((a, b) => b.total - a.total),
    cardBreakdown: [...cardMap.values()].sort((a, b) => b.total - a.total),
    latest,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
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