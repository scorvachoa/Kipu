import Link from "next/link";
import {
  Check,
  CreditCard,
  Database,
  Eye,
  Globe,
  ListChecks,
  ListOrdered,
  Lock,
  Mail,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Wand2,
  Zap,
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
    title: "Conecta tu Gmail",
    description:
      "Inicia sesión con tu cuenta y autoriza el acceso de solo lectura a las notificaciones de tus bancos.",
  },
  {
    icon: RefreshCw,
    title: "Sincroniza automáticamente",
    description:
      "Kipu lee los correos de tus bancos y extrae montos, fechas, tarjetas y comercios de forma determinista y con IA de respaldo.",
  },
  {
    icon: Tag,
    title: "Todo clasificado",
    description:
      "Las transacciones se categorizan por comercio y se asignan a tu tarjeta o cuenta automáticamente.",
  },
  {
    icon: CreditCard,
    title: "Controla y ahorra",
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

const HIGHLIGHTS = [
  { icon: Wand2, title: "Automático", description: "Sin registrar gastos a mano. Kipu lee tus notificaciones." },
  { icon: ListChecks, title: "Clasificado", description: "Cada consumo va a su categoría y a tu tarjeta o cuenta." },
  { icon: Eye, title: "Visible", description: "Dashboards mensuales y resúmenes en Telegram para decidir mejor." },
];

interface SectionAccent {
  label: string;
  icon: React.ElementType;
  eyebrow: string;
  chip: string;
  chipHover: string;
  number: string;
}

const ACCENTS: Record<"indigo" | "amber" | "emerald", SectionAccent> = {
  indigo: {
    label: "En 4 pasos",
    icon: ListOrdered,
    eyebrow: "border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/20",
    chipHover:
      "group-hover:bg-indigo-500 group-hover:text-white group-hover:ring-indigo-500",
    number: "text-indigo-500/25",
  },
  amber: {
    label: "Funcionalidades",
    icon: Sparkles,
    eyebrow: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20",
    chipHover:
      "group-hover:bg-amber-500 group-hover:text-white group-hover:ring-amber-500",
    number: "text-amber-500/25",
  },
  emerald: {
    label: "Tus datos protegidos",
    icon: ShieldCheck,
    eyebrow: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
    chipHover:
      "group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500",
    number: "text-emerald-500/25",
  },
};

function SectionHeader({
  accent,
  title,
  subtitle,
}: {
  accent: SectionAccent;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 text-center">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${accent.eyebrow}`}
      >
        <accent.icon className="size-3.5" />
        {accent.label}
      </span>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight lg:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: SectionAccent;
}) {
  return (
    <div className="group flex h-full flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200 ${accent.chip} ${accent.chipHover}`}
      >
        <Icon className="size-5" />
      </span>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  icon: Icon,
  index,
  title,
  description,
  accent,
}: {
  icon: React.ElementType;
  index: number;
  title: string;
  description: string;
  accent: SectionAccent;
}) {
  return (
    <div className="group relative flex h-full flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200 ${accent.chip} ${accent.chipHover}`}
        >
          <Icon className="size-5" />
        </span>
        <span className={`text-4xl font-bold ${accent.number}`}>{index}</span>
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default async function WelcomePage() {
  const user = await getOptionalUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-dvh overflow-x-clip flex flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <KipuLogo className="h-8 w-8 overflow-hidden rounded-lg" />
            Kipu
          </div>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login?mode=register">Crear cuenta</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative mx-auto w-full max-w-5xl px-6 pt-16 pb-10 text-center sm:pt-24">
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            <Sparkles className="size-3.5 text-amber-500" />
            Tu dinero bajo control, sin esfuerzo
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Tus gastos personales,{" "}
            <span className="bg-linear-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              organizados
            </span>{" "}
            automáticamente
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Kipu lee las notificaciones de tus bancos en Gmail, las clasifica
            por categoría y tarjeta, y te muestra un dashboard mensual con tus
            gastos. Así de simple.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11 px-6 shadow-lg shadow-primary/10">
              <Link href="/login?mode=register">Crear cuenta gratis</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-6">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Solo lectura", "Sin scraping", "+180 bancos", "Instalable (PWA)"].map(
              (item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-emerald-500" />
                  {item}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <DashboardPreview />
      </section>

      <section className="border-y bg-card/60">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight lg:text-3xl">
              ¿Qué es Kipu?
            </h2>
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
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.title}
                className="group rounded-xl border bg-card p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="size-5" />
                </span>
                <p className="mt-4 text-lg font-semibold text-primary">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-indigo-500/[0.04] dark:bg-indigo-400/[0.04]">
        <div className="mx-auto w-full max-w-5xl px-6 py-20">
          <SectionHeader
            accent={ACCENTS.indigo}
            title="¿Cómo funciona?"
            subtitle="Cuatro pasos y tu dinero queda registrado solo."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <StepCard key={step.title} {...step} index={index + 1} accent={ACCENTS.indigo} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto w-full max-w-5xl px-6 py-20">
          <SectionHeader
            accent={ACCENTS.amber}
            title="Qué puedes hacer con Kipu"
            subtitle="Lo esencial de tus finanzas, automatizado de punta a punta."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} accent={ACCENTS.amber} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-20">
        <h2 className="mb-2 text-center text-2xl font-semibold tracking-tight lg:text-3xl">
          Bancos y billeteras compatibles
        </h2>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Detección automática de notificaciones de más de 180 dominios
          bancarios y de pagos.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {BANKS.map((bank) => (
            <span
              key={bank}
              className="rounded-full border bg-card px-4 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              {bank}
            </span>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto w-full max-w-5xl px-6 py-20">
          <SectionHeader
            accent={ACCENTS.emerald}
            title="Seguridad y privacidad"
            subtitle="Tus datos financieros son sensibles; los tratamos como tal."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECURITY.map((item) => (
              <FeatureCard key={item.title} {...item} accent={ACCENTS.emerald} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl border bg-card px-6 py-14 text-center shadow-xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative">
            <h2 className="text-2xl font-semibold tracking-tight lg:text-3xl">
              Empieza hoy
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Crea tu cuenta, conecta tu Gmail y deja que Kipu organice tus
              gastos automáticamente.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="h-11 px-6 shadow-lg shadow-primary/10">
                <Link href="/login?mode=register">Crear cuenta gratis</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-6">
                <Link href="/login">Iniciar sesión</Link>
              </Button>
            </div>
          </div>
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