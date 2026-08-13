# Kipu

Control de finanzas personales. Kipu sincroniza tus movimientos bancarios (BCP e Interbank) directamente desde Gmail, los clasifica por categoría y tarjeta, y los muestra en un dashboard. Sin integraciones bancarias ni scraping: la única fuente de movimientos es tu correo.

## Funcionalidades

- Autenticación con email/contraseña o Google (Supabase Auth).
- Sincronización de transacciones desde Gmail (OAuth) para BCP e Interbank.
- Parseo de notificaciones reales: consumos, retiros de cajero, pagos de servicios/tarjeta, transferencias, yapeos recibidos y movimientos de wardadito.
- Dashboard mensual: total de gastos, desglose por tarjeta y categoría, últimos movimientos.
- Gestión de tarjetas, cuentas, personas y reglas de comercios → categorías.
- PWA instalable.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- shadcn/ui + Recharts
- Supabase (Postgres, Auth, RLS)
- Gmail API (OAuth 2.0)
- Telegram Bot API
- Vitest (tests)

## Configuración

1. Crea un proyecto en Supabase y aplica las migraciones de `supabase/migrations/`.
2. Crea un proyecto OAuth en Google Cloud con acceso a la API de Gmail y configura la pantalla de consentimiento.
3. Copia `.env.example` a `.env.local` y completa las variables (tabla abajo).
4. Instala dependencias y arranca:

```bash
npm install
npm run dev
```

### Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de service role (solo servidor) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciales OAuth de Google Cloud |
| `GOOGLE_REDIRECT_URI` | URI de redirección OAuth (ej. `http://localhost:3000/api/gmail/callback`) |
| `GMAIL_TOKEN_ENCRYPTION_KEY` | Clave AES para cifrar el refresh token de Gmail |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram |
| `TELEGRAM_WEBHOOK_SECRET` | Secreto del webhook de Telegram |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (dev: `http://localhost:3000`) |

## Scripts

```bash
npm run dev       # servidor de desarrollo
npm run build     # build de producción
npm run start     # servidor de producción
npm run lint      # ESLint
npm run test:run  # Vitest
```

## Estructura

- `src/app/` — rutas de la app (App Router) y API routes.
- `src/lib/` — lógica de negocio: parsers de correos, sync Gmail, Supabase, finanzas.
- `src/tests/` — tests y fixtures (con formatos reales de correos).
- `supabase/migrations/` — migraciones de la base de datos.
