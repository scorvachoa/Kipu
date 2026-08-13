import { requireUserOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listCardsWithOwners, listPeople } from "@/lib/supabase/queries";
import { CardsView } from "@/components/cards/cards-view";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const user = await requireUserOrRedirect();
  const supabase = await createClient();
  const [cards, people] = await Promise.all([
    listCardsWithOwners(supabase, user.id),
    listPeople(supabase, user.id),
  ]);

  return <CardsView cards={cards} people={people} />;
}