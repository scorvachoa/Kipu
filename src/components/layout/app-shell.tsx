"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Tags,
  Settings,
  LogOut,
} from "lucide-react";
import { signOut } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { KipuLogo } from "@/components/layout/kipu-logo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/cards", label: "Tarjetas", icon: CreditCard },
  { href: "/categories", label: "Categorías", icon: Tags },
  { href: "/settings", label: "Configuración", icon: Settings },
] as const;

export function AppShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <KipuLogo className="h-7 w-7 overflow-hidden rounded-md" />
            Kipu
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname.startsWith(href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {userEmail ? (
              <span className="hidden max-w-[180px] truncate text-sm text-muted-foreground sm:block">
                {userEmail}
              </span>
            ) : null}
            <form action={signOut}>
              <Button variant="ghost" size="icon" aria-label="Cerrar sesión" title="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-10">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}