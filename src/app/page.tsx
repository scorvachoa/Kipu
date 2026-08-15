import Link from "next/link";
import {
  Mail,
  TrendingDown,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { getOptionalUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: Mail,
    title: "Sincronización con Gmail",
    description:
      "Conecta tu Gmail y Kipu detecta automáticamente los movimientos de BCP e Interbank. Sin integraciones bancarias ni scraping.",
  },
  {
    icon: TrendingDown,
    title: "Gastos automáticos y categorizados",
    description:
      "Cada consumo se clasifica por categoría y tarjeta con reglas propias e inteligencia artificial cuando hacen falta.",
  },
  {
    icon: MessageSquare,
    title: "Bot de Telegram",
    description:
      "Consulta tu resumen mensual, últimos gastos y sincronización directamente desde el chat, en lenguaje natural.",
  },
  {
    icon: ShieldCheck,
    title: "Tus datos, solo tuyos",
    description:
      "Cada cuenta accede únicamente a su información. Aislamiento por usuario desde la base de datos.",
  },
];

export default async function WelcomePage() {
  const user = await getOptionalUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <CreditCard className="size-5" />
          Kipu
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild>
            <Link href="/login?mode=register">Crear cuenta</Link>
          </Button>
        </nav>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" />
          Tu dinero bajo control, sin esfuerzo
        </div>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Tus gastos personales, organizados automáticamente
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Kipu lee las notificaciones de tus bancos en Gmail, las clasifica por
          categoría y tarjeta, y te muestra un dashboard mensual con tus
          gastos. Así de simple.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-11 px-6">
            <Link href="/login?mode=register">Crear cuenta gratis</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 px-6">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-2 rounded-xl border bg-card p-5"
          >
            <feature.icon className="size-5 text-primary" />
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </section>

      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        Kipu · Finanzas personales con Gmail + IA
      </footer>
    </main>
  );
}