-- Estados OAuth de Gmail de un solo uso para prevenir CSRF
-- y vincular el code de Google con la cuenta Kipu autenticada.

create table public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

alter table public.oauth_states enable row level security;