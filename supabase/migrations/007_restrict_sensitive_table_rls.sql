-- Restringir el acceso anónimo a las conexiones Gmail y enlaces de Telegram.
-- La aplicación accede a estas tablas exclusivamente con el service role
-- (src/lib/supabase/gmail-adapter.ts y telegram-adapter.ts), por lo que bajo
-- RLS sin policies ('default deny') el anon key no puede leer el
-- refresh_token_encrypted ni manipular los enlaces.
-- Las lecturas existentes vía anon (settings/dashboard) pasan al admin client.

drop policy if exists "gmail_connections_select_own"
  on public.gmail_connections;
drop policy if exists "gmail_connections_insert_own"
  on public.gmail_connections;
drop policy if exists "gmail_connections_update_own"
  on public.gmail_connections;
drop policy if exists "gmail_connections_delete_own"
  on public.gmail_connections;

drop policy if exists "telegram_links_select_own"
  on public.telegram_links;
drop policy if exists "telegram_links_insert_own"
  on public.telegram_links;
drop policy if exists "telegram_links_update_own"
  on public.telegram_links;
drop policy if exists "telegram_links_delete_own"
  on public.telegram_links;