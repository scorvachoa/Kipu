import { requireUserOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listCategories } from "@/lib/supabase/queries";
import { CategoriesView } from "@/components/categories/categories-view";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await requireUserOrRedirect();
  const supabase = await createClient();
  const categories = await listCategories(supabase, user.id);

  return <CategoriesView categories={categories} />;
}