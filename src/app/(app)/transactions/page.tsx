import { requireUserOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  listTransactions,
  listCardsWithOwners,
  listPeople,
  listCategories,
  type TransactionFilters,
} from "@/lib/supabase/queries";
import { TransactionsView } from "@/components/transactions/transactions-view";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUserOrRedirect();
  const supabase = await createClient();
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const filters: TransactionFilters = {
    monthKey: first(params.month) || undefined,
    bank: first(params.bank) || undefined,
    cardId: first(params.card) || undefined,
    personId: first(params.person) || undefined,
    categoryId: first(params.category) || undefined,
    transactionType: first(params.type) || undefined,
    search: first(params.q) || undefined,
  };

  const [rows, cards, people, categories] = await Promise.all([
    listTransactions(supabase, user.id, filters),
    listCardsWithOwners(supabase, user.id),
    listPeople(supabase, user.id),
    listCategories(supabase, user.id),
  ]);

  return (
    <TransactionsView
      rows={rows}
      cards={cards}
      people={people}
      categories={categories}
    />
  );
}