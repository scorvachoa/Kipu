import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { KipuLogo } from "@/components/layout/kipu-logo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-4 p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
        <KipuLogo className="h-8 w-8 overflow-hidden rounded-lg" />
        Kipu
      </Link>
      {children}
      <Button asChild variant="ghost" size="sm">
        <Link href="/">Volver a la página de bienvenida</Link>
      </Button>
    </main>
  );
}
