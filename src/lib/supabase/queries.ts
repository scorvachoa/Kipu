import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { SummaryTx } from "@/lib/finance/summary";
import { monthKeyToRange } from "@/lib/finance/summary";
import { createAdminClient } from "@/lib/supabase/admin";

export interface TransactionFilters {
  monthKey?: string;
  bank?: string;
  cardId?: string;
  personId?: string;
  categoryId?: string;
  transactionType?: string;
  search?: string;
}

export interface ListTransactionsOptions {
  limit?: number;
}

export interface CardWithOwner {
  id: string;
  user_id: string;
  bank: string;
  name: string;
  card_type: string;
  last4: string;
  owner_person_id: string | null;
  currency: string;
  closing_day: number | null;
  payment_day: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  people: { name: string } | null;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GmailConnectionStatus {
  connected: boolean;
  email_address: string | null;
  last_sync_at: string | null;
}

export interface TelegramConnectionStatus {
  connected: boolean;
  telegram_user_id: string | null;
  notify_new_expenses: boolean;
  notify_payments: boolean;
  notify_needs_review: boolean;
}

export async function getTelegramConnection(
  userId: string,
): Promise<TelegramConnectionStatus> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("telegram_links")
    .select(
      "telegram_user_id, notify_new_expenses, notify_payments, notify_needs_review",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return {
      connected: false,
      telegram_user_id: null,
      notify_new_expenses: true,
      notify_payments: true,
      notify_needs_review: false,
    };
  }
  return {
    connected: true,
    telegram_user_id: data.telegram_user_id,
    notify_new_expenses: data.notify_new_expenses,
    notify_payments: data.notify_payments,
    notify_needs_review: data.notify_needs_review,
  };
}

export async function getMonthSummaryRows(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthKey: string,
): Promise<SummaryTx[]> {
  const { gte, lt } = monthKeyToRange(monthKey);
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `id, amount, currency, transaction_type, payment_method, merchant,
       transaction_date, transaction_time, status,
       categories(name, icon, color), cards(name, bank, last4), people(name)`,
    )
    .eq("user_id", userId)
    .gte("transaction_date", gte)
    .lt("transaction_date", lt);
  if (error) {
    throw error;
  }
  return (data ?? []) as unknown as SummaryTx[];
}

export async function listTransactions(
  supabase: SupabaseClient<Database>,
  userId: string,
  filters: TransactionFilters = {},
  options: ListTransactionsOptions = {},
): Promise<SummaryTx[]> {
  let query = supabase
    .from("transactions")
    .select(
      `id, amount, currency, transaction_type, payment_method, merchant,
       transaction_date, transaction_time, status,
       categories(name, icon, color), cards(name, bank, last4), people(name)`,
    )
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("transaction_time", { ascending: false })
    .limit(options.limit ?? 300);

  if (filters.monthKey) {
    const { gte, lt } = monthKeyToRange(filters.monthKey);
    query = query.gte("transaction_date", gte).lt("transaction_date", lt);
  }
  if (filters.bank) {
    query = query.eq("bank", filters.bank);
  }
  if (filters.cardId) {
    query = query.eq("card_id", filters.cardId);
  }
  if (filters.personId) {
    query = query.eq("person_id", filters.personId);
  }
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters.transactionType) {
    query = query.eq("transaction_type", filters.transactionType);
  }
  if (filters.search) {
    query = query.ilike("merchant", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data ?? []) as unknown as SummaryTx[];
}

export async function listCardsWithOwners(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CardWithOwner[]> {
  const { data, error } = await supabase
    .from("cards")
    .select("*, people(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []) as unknown as CardWithOwner[];
}

export async function listCategories(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Category[]> {
  if (!userId) {
    return [];
  }
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("active", true)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order("name", { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []) as Category[];
}

export async function listPeople(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Person[]> {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []) as Person[];
}

export interface CategorySpend {
  category_id: string;
  currency: string;
  total: number;
}

export async function getCategorySpending(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthKey: string,
): Promise<CategorySpend[]> {
  const { gte, lt } = monthKeyToRange(monthKey);
  const { data, error } = await supabase
    .from("transactions")
    .select("category_id, currency, amount, transaction_type")
    .eq("user_id", userId)
    .eq("transaction_type", "purchase")
    .not("category_id", "is", null)
    .gte("transaction_date", gte)
    .lt("transaction_date", lt);
  if (error) {
    throw error;
  }
  const byCategory = new Map<string, Map<string, number>>();
  for (const row of data ?? []) {
    if (!row.category_id || row.currency == null) continue;
    const perCurrency = byCategory.get(row.category_id) ?? new Map<string, number>();
    const currency = row.currency || "PEN";
    perCurrency.set(currency, (perCurrency.get(currency) ?? 0) + Number(row.amount));
    byCategory.set(row.category_id, perCurrency);
  }
  const result: CategorySpend[] = [];
  for (const [categoryId, perCurrency] of byCategory) {
    for (const [currency, total] of perCurrency) {
      result.push({
        category_id: categoryId,
        currency,
        total: Math.round(total * 100) / 100,
      });
    }
  }
  return result;
}

export async function getGmailConnection(
  userId: string,
): Promise<GmailConnectionStatus> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("gmail_connections")
    .select("email_address, last_sync_at, revoked_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data || data.revoked_at) {
    return { connected: false, email_address: null, last_sync_at: null };
  }
  return {
    connected: true,
    email_address: data.email_address,
    last_sync_at: data.last_sync_at,
  };
}