import Link from "next/link";
import {
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Tag,
  CreditCard,
  Zap,
  Smartphone,
  Globe,
  Lock,
  Database,
} from "lucide-react";
import { getOptionalUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KipuLogo } from "@/components/layout/kipu-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { DashboardPreview } from "@/components/welcome/dashboard-preview";
import { CategoryIcon } from "@/components/category-icon";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: Mail,
    title: "Sincronización con Gmail",
    description:
      "Conecta tu Gmail y Kipu detecta automáticamente los movimientos de tus bancos. Sin integraciones bancarias ni scraping.",
  },
  {
    icon: Tag,
    title: "Categorización automática",
    description:
      "Cada consumo se clasifica por categoría y tarjeta con reglas propias e inteligencia artificial cuando hacen falta.",
  },
  {
    icon: MessageSquare,
    title: "Bot de Telegram",
    description:
      "Consulta tu resumen mensual, últimos gastos y anomalías directamente desde el chat, en lenguaje natural.",
  },
  {
    icon: ShieldCheck,
    title: "Tus datos, solo tuyos",
    description:
      "Cada cuenta accede únicamente a su información. Aislamiento por usuario desde la base de datos.",
  },
];

const STEPS = [
  {
    icon: Mail,
    title: "1. Conecta tu Gmail",
    description:
      "Inicia sesión con tu cuenta y autoriza el acceso de solo lectura a las notificaciones de tus bancos.",
  },
  {
    icon: RefreshCw,
    title: "2. Sincroniza automáticamente",
    description:
      "Kipu lee los correos de tus bancos y extrae montos, fechas, tarjetas y comercios de forma determinista y con IA de respaldo.",
  },
  {
    icon: Tag,
    title: "3. Todo clasificado",
    description:
      "Las transacciones se categorizan por comercio y se asignan a tu tarjeta o cuenta automáticamente.",
  },
  {
    icon: CreditCard,
    title: "4. Controla y ahorra",
    description:
      "Revisa tu dashboard mensual, detecta gastos anómalos y suscripciones recurrentes desde la web o Telegram.",
  },
];

const BANKS = [
  "BCP",
  "Interbank",
  "BBVA",
  "Scotiabank",
  "BanBif",
  "MiBanco",
  "Cajas municipales",
  "Financieras",
  "Yape",
  "Plin",
  "Tunki",
  "iO",
];

const SECURITY = [
  {
    icon: Lock,
    title: "Autenticación segura",
    description:
      "Acceso con contraseña o Google, sesiones protegidas y recuperación de contraseña integrada.",
  },
  {
    icon: Database,
    title: "Datos aislados por usuario",
    description:
      "Cada cuenta solo ve su información. Políticas de seguridad a nivel de fila en la base de datos.",
  },
  {
    icon: Globe,
    title: "Solo lectura en Gmail",
    description:
      "Kipu solo lee los correos de tus bancos. No puede enviar mensajes ni modificar tu cuenta.",
  },
  {
    icon: Smartphone,
    title: "Disponible en tu celular",
    description:
      "Instálala como aplicación desde el navegador y sincroniza automáticamente cada día.",
  },
];

export default async function WelcomePage() {
  const user = await getOptionalUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <KipuLogo className="h-8 w-8 overflow-hidden rounded-lg" />
            Kipu
          </div>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/login?mode=register">Crear cuenta</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" />
          Tu dinero bajo control, sin esfuerzo
        </div>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Tus gastos personales, organizados automáticamente
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Kipu lee las notificaciones de tus bancos en Gmail, las clasifica por
          categoría y tarjeta, y te muestra un dashboard mensual con tus gastos.
          Así de simple.
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

      <section className="mx-auto w-full max-w-5xl px-6 pb-16">
        <DashboardPreview />
      </section>

      <section className="border-y bg-card/60">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold">¿Qué es Kipu?</h2>
            <p className="mt-4 text-muted-foreground">
              Kipu es una aplicación de finanzas personales que convierte tus
              correos de bancos en un registro automático de tus gastos. En
              lugar de llenar hojas de cálculo o revisar extractos a mano,
              conecta tu Gmail y Kipu detecta cada consumo, lo clasifica por
              categoría y tarjeta, y te da un dashboard mensual con lo que
              gastas y dónde.
            </p>
            <p className="mt-3 text-muted-foreground">
              Está pensada para personas que quieren saber a dónde va su dinero
              sin cambiar de banco ni usar integraciones bancarias: solo se
              necesita Gmail.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-5 text-center">
              <p className="text-2xl font-semibold text-primary">Automático</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sin registrar gastos a mano. Kipu lee tus notificaciones.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 text-center">
              <p className="text-2xl font-semibold text-primary">Clasificado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cada consumo va a su categoría y a tu tarjeta o cuenta.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 text-center">
              <p className="text-2xl font-semibold text-primary">Visible</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Dashboards mensuales y resúmenes en Telegram para decidir mejor.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-16">
        <h2 className="mb-6 text-center text-2xl font-semibold">
          ¿Cómo funciona?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div
              key={step.title}
              className="flex flex-col gap-2 rounded-xl border bg-card p-5"
            >
              <step.icon className="size-5 text-primary" />
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="mb-6 text-center text-2xl font-semibold">
            Qué puedes hacer con Kipu
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-2 rounded-xl border bg-card p-5"
              >
                <feature.icon className="size-5 text-primary" />
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <h2 className="mb-2 text-center text-2xl font-semibold">
          Bancos y billeteras compatibles
        </h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Detección automática de notificaciones de más de 180 dominios bancarios
          y de pagos.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {BANKS.map((bank) => (
            <span
              key={bank}
              className="rounded-full border bg-card px-4 py-1.5 text-sm"
            >
              {bank}
            </span>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="mb-6 text-center text-2xl font-semibold">
            Seguridad y privacidad
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECURITY.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-2 rounded-xl border bg-card p-5"
              >
                <item.icon className="size-5 text-primary" />
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 pb-16 text-center">
        <h2 className="text-2xl font-semibold">Empieza hoy</h2>
        <p className="max-w-xl text-muted-foreground">
          Crea tu cuenta, conecta tu Gmail y deja que Kipu organice tus gastos
          automáticamente.
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

      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span className="inline-flex items-center gap-2">
            <CategoryIcon name="MoreHorizontal" className="h-3.5 w-3.5" />
            Kipu · Finanzas personales con Gmail + IA ·{" "}
            <Zap className="h-3.5 w-3.5" />
          </span>
          <span className="inline-flex items-center gap-4">
            <Link
              href="/privacy"
              className="underline-offset-2 hover:underline"
            >
              Política de Privacidad
            </Link>
            <Link href="/terms" className="underline-offset-2 hover:underline">
              Condiciones del Servicio
            </Link>
          </span>
        </div>
      </footer>
    </main>
  );
}
