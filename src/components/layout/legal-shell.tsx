import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { KipuLogo } from "@/components/layout/kipu-logo";

export function LegalShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <KipuLogo className="h-8 w-8 overflow-hidden rounded-lg" />
            Kipu
          </Link>
          <nav className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Volver
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        {children}
      </div>
      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        <span>
          Kipu · Finanzas personales con Gmail + IA ·{" "}
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            Privacidad
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="underline-offset-2 hover:underline">
            Términos
          </Link>
        </span>
      </footer>
    </main>
  );
}