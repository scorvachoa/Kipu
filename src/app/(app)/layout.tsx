import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { getGmailConnection } from "@/lib/supabase/queries";
import { AppShell } from "@/components/layout/app-shell";
import { AutoGmailSync } from "@/components/layout/auto-gmail-sync";
import { FirstSyncDialog } from "@/components/onboarding/first-sync-dialog";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();
  if (!user) {
    redirect("/login");
  }

  const gmail = await getGmailConnection(user.id);
  const needsFirstSync = gmail.connected
    ? gmail.last_sync_at === null
    : true;

  return (
    <>
      <AppShell userEmail={user.email ?? null}>{children}</AppShell>
      <AutoGmailSync />
      <FirstSyncDialog
        open={needsFirstSync}
        connected={gmail.connected}
        emailAddress={gmail.email_address}
      />
    </>
  );
}