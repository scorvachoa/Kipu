import { requireUserOrRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getGmailConnection,
  getTelegramConnection,
  listPeople,
} from "@/lib/supabase/queries";
import { SettingsView } from "@/components/settings/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUserOrRedirect();
  const supabase = await createClient();
  const [gmail, telegram, people] = await Promise.all([
    getGmailConnection(supabase, user.id),
    getTelegramConnection(supabase, user.id),
    listPeople(supabase, user.id),
  ]);

  return (
    <SettingsView
      userEmail={user.email ?? null}
      gmail={gmail}
      telegram={telegram}
      people={people}
    />
  );
}