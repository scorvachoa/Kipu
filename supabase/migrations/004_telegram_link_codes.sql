-- Códigos de un solo uso para vincular Telegram a una cuenta Kipu.
-- Flujo: Configuración → "Conectar Telegram" → Kipu guarda un código
-- temporal → el usuario lo envía al bot con /start CODIGO.

create table public.telegram_link_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

alter table public.telegram_link_codes enable row level security;

create policy "telegram_link_codes_select_own"
  on public.telegram_link_codes for select
  using (user_id = auth.uid());

create policy "telegram_link_codes_insert_own"
  on public.telegram_link_codes for insert
  with check (user_id = auth.uid());

create policy "telegram_link_codes_delete_own"
  on public.telegram_link_codes for delete
  using (user_id = auth.uid());

create index telegram_link_codes_code_idx
  on public.telegram_link_codes (code);