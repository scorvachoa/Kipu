import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

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

  return <AppShell userEmail={user.email ?? null}>{children}</AppShell>;
}