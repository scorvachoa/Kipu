# Kipu

Control de finanzas personales. Kipu sincroniza tus movimientos bancarios (BCP e Interbank) directamente desde Gmail, los clasifica por categoría y tarjeta, y los muestra en un dashboard. Sin integraciones bancarias ni scraping: la única fuente de movimientos es tu correo.

## Funcionalidades

- Autenticación con email/contraseña o Google (Supabase Auth).
- Sincronización de transacciones desde Gmail (OAuth) para BCP e Interbank.
- Parseo de notificaciones reales: consumos, retiros de cajero, pagos de servicios/tarjeta, transferencias, yapeos recibidos y movimientos de wardadito.
- Dashboard mensual: total de gastos, desglose por tarjeta y categoría, últimos movimientos.
- Gestión de tarjetas, cuentas, personas y reglas de comercios → categorías.
- Bot de Telegram: vincula tu cuenta y consulta `/resumen`, `/gastos`, `/tarjetas`, `/categorias` o `/sincronizar` desde el chat.
- Notificaciones a Telegram de nuevos gastos, pagos y transacciones que requieren revisión (configurable en Ajustes).
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

## Telegram

1. Crea un bot con [@BotFather](https://t.me/BotFather) y copia su token en `TELEGRAM_BOT_TOKEN`.
2. Genera un valor aleatorio para `TELEGRAM_WEBHOOK_SECRET` (se valida con el header `X-Telegram-Bot-Api-Secret-Token`).
3. Registra el webhook apuntando a `{NEXT_PUBLIC_APP_URL}/api/telegram/webhook` con el mismo secreto.
4. En Ajustes → Telegram, pulsa "Conectar Telegram" y envía al bot `/start <codigo>` (el código expira en 10 minutos y es de un solo uso).

Comandos disponibles en el bot: `/ayuda`, `/resumen`, `/gastos`, `/tarjetas`, `/categorias`, `/sincronizar`, `/desvincular`.

## Scripts

```bash
npm run dev            # servidor de desarrollo
npm run build          # build de producción
npm run start          # servidor de producción
npm run lint           # ESLint
npm run test:run       # Vitest
npm run telegram:setup # registra el webhook de Telegram contra NEXT_PUBLIC_APP_URL
```

## Despliegue en Vercel

1. Sube el repositorio a GitHub y conéctalo en [Vercel](https://vercel.com/new) (Importa tu repo). Vercel detecta Next.js automáticamente y usa el `crons` de `vercel.json`.
2. Completa en **Project → Settings → Environment Variables** todas las variables de `.env.example` con los valores de **producción** (NUNCA uses `.env` local):
   - `NEXT_PUBLIC_APP_URL` = `https://tu-app.vercel.app`
   - `GOOGLE_REDIRECT_URI` = `https://tu-app.vercel.app/api/gmail/callback`
   - `GOOGLE_AI_API_KEY` opcional (clasificación con IA).
3. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials), en tu OAuth Client ID añade en *Authorized redirect URIs* la URL de producción del callback (`https://tu-app.vercel.app/api/gmail/callback`) y en *Authorized JavaScript origins* `https://tu-app.vercel.app`.
4. Despliega y, cuando la app esté en línea, registra el webhook de Telegram:

   ```bash
   npm run telegram:setup
   ```

5. Aplica las migraciones de `supabase/migrations/` al proyecto Supabase de producción.

> Las variables `NEXT_PUBLIC_*` se inyectan en build; las demás (service role, tokens, secretos) viven solo en el servidor y nunca deben exponerse en el cliente.

### Sincronización automática (Vercel Cron)

`vercel.json` define un cron diario (`0 12 * * *` UTC) que llama a `/api/cron/sync`: sincroniza el Gmail de todos los usuarios conectados automáticamente. En el plan **Hobby** los crons solo pueden ejecutarse **una vez al día**; para más frecuencia (2-3 veces/día) necesitas plan Pro y añadir más horarios a `crons`.

## Estructura

- `src/app/` — rutas de la app (App Router) y API routes.
- `src/lib/` — lógica de negocio: parsers de correos, sync Gmail, Supabase, finanzas.
- `src/tests/` — tests y fixtures (con formatos reales de correos).
- `supabase/migrations/` — migraciones de la base de datos.
