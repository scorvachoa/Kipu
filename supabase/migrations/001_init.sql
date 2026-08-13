create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.ensure_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.categories (user_id, name, icon, active)
  select p_user_id, name, icon, true
  from (
    values
      ('Alimentación', 'Utensils'),
      ('Transporte', 'Car'),
      ('Compras', 'ShoppingCart'),
      ('Entretenimiento', 'Clapperboard'),
      ('Servicios', 'Receipt'),
      ('Salud', 'HeartPulse'),
      ('Educación', 'GraduationCap'),
      ('Viajes', 'Plane'),
      ('Suscripciones', 'Repeat'),
      ('Hogar', 'Home'),
      ('Finanzas', 'Landmark'),
      ('Otros', 'MoreHorizontal')
  ) as defaults (name, icon)
  where not exists (
    select 1 from public.categories c
    where c.user_id = p_user_id and c.name = defaults.name
  );
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.email
    )
  )
  on conflict (user_id) do nothing;

  perform public.ensure_default_categories(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'America/Lima',
  currency text not null default 'PEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bank text not null,
  name text not null,
  card_type text not null check (card_type in ('credit', 'debit')),
  last4 text not null check (last4 ~ '^[0-9]{4}$'),
  owner_person_id uuid references public.people(id) on delete set null,
  currency text not null default 'PEN',
  closing_day smallint check (closing_day between 1 and 31),
  payment_day smallint check (payment_day between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bank text not null,
  name text not null,
  account_type text not null default 'savings',
  last4 text check (last4 ~ '^[0-9]{4}$'),
  owner_person_id uuid references public.people(id) on delete set null,
  currency text not null default 'PEN',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  parent_id uuid references public.categories(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.merchant_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant_pattern text not null,
  category_id uuid not null references public.categories(id) on delete cascade,
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid references public.people(id) on delete set null,
  card_id uuid references public.cards(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  bank text not null,
  transaction_type text not null check (
    transaction_type in ('purchase', 'payment', 'transfer', 'withdrawal', 'refund', 'fee', 'other')
  ),
  payment_method text not null check (
    payment_method in ('credit_card', 'debit_card', 'bank_account', 'unknown')
  ),
  amount numeric(14, 2) not null,
  currency text not null default 'PEN',
  transaction_date date not null,
  transaction_time time,
  merchant text,
  normalized_merchant text,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  operation_number text,
  fingerprint text,
  gmail_message_id text,
  gmail_thread_id text,
  source text not null default 'gmail',
  raw_reference text,
  status text not null default 'confirmed' check (
    status in ('confirmed', 'pending', 'ignored', 'needs_review')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email_address text,
  refresh_token_encrypted text not null,
  scope text,
  last_sync_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.telegram_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  telegram_user_id text not null,
  notify_new_expenses boolean not null default true,
  notify_payments boolean not null default true,
  notify_needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, telegram_user_id)
);

create table public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  emails_found integer not null default 0,
  emails_processed integer not null default 0,
  transactions_created integer not null default 0,
  duplicates_found integer not null default 0,
  requires_review integer not null default 0,
  errors integer not null default 0,
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);

create index transactions_user_bank_operation_idx
  on public.transactions (user_id, bank, operation_number)
  where operation_number is not null;

create index transactions_user_fingerprint_idx
  on public.transactions (user_id, fingerprint)
  where fingerprint is not null;

create unique index transactions_unique_gmail_message_idx
  on public.transactions (user_id, gmail_message_id)
  where gmail_message_id is not null;

create index cards_user_bank_last4_idx
  on public.cards (user_id, bank, last4);

create index merchant_rules_user_pattern_idx
  on public.merchant_rules (user_id, merchant_pattern);

create index categories_user_idx
  on public.categories (user_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger people_set_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

create trigger cards_set_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger merchant_rules_set_updated_at
  before update on public.merchant_rules
  for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create trigger gmail_connections_set_updated_at
  before update on public.gmail_connections
  for each row execute function public.set_updated_at();

create trigger telegram_links_set_updated_at
  before update on public.telegram_links
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.people enable row level security;
alter table public.cards enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.merchant_rules enable row level security;
alter table public.transactions enable row level security;
alter table public.gmail_connections enable row level security;
alter table public.telegram_links enable row level security;
alter table public.sync_logs enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (user_id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (user_id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "people_select_own"
  on public.people for select
  using (user_id = auth.uid());

create policy "people_insert_own"
  on public.people for insert
  with check (user_id = auth.uid());

create policy "people_update_own"
  on public.people for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "people_delete_own"
  on public.people for delete
  using (user_id = auth.uid());

create policy "cards_select_own"
  on public.cards for select
  using (user_id = auth.uid());

create policy "cards_insert_own"
  on public.cards for insert
  with check (user_id = auth.uid());

create policy "cards_update_own"
  on public.cards for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "cards_delete_own"
  on public.cards for delete
  using (user_id = auth.uid());

create policy "accounts_select_own"
  on public.accounts for select
  using (user_id = auth.uid());

create policy "accounts_insert_own"
  on public.accounts for insert
  with check (user_id = auth.uid());

create policy "accounts_update_own"
  on public.accounts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "accounts_delete_own"
  on public.accounts for delete
  using (user_id = auth.uid());

create policy "categories_select_own"
  on public.categories for select
  using (user_id = auth.uid());

create policy "categories_insert_own"
  on public.categories for insert
  with check (user_id = auth.uid());

create policy "categories_update_own"
  on public.categories for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "categories_delete_own"
  on public.categories for delete
  using (user_id = auth.uid());

create policy "merchant_rules_select_own"
  on public.merchant_rules for select
  using (user_id = auth.uid());

create policy "merchant_rules_insert_own"
  on public.merchant_rules for insert
  with check (user_id = auth.uid());

create policy "merchant_rules_update_own"
  on public.merchant_rules for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "merchant_rules_delete_own"
  on public.merchant_rules for delete
  using (user_id = auth.uid());

create policy "transactions_select_own"
  on public.transactions for select
  using (user_id = auth.uid());

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (user_id = auth.uid());

create policy "transactions_update_own"
  on public.transactions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "transactions_delete_own"
  on public.transactions for delete
  using (user_id = auth.uid());

create policy "gmail_connections_select_own"
  on public.gmail_connections for select
  using (user_id = auth.uid());

create policy "gmail_connections_insert_own"
  on public.gmail_connections for insert
  with check (user_id = auth.uid());

create policy "gmail_connections_update_own"
  on public.gmail_connections for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "gmail_connections_delete_own"
  on public.gmail_connections for delete
  using (user_id = auth.uid());

create policy "telegram_links_select_own"
  on public.telegram_links for select
  using (user_id = auth.uid());

create policy "telegram_links_insert_own"
  on public.telegram_links for insert
  with check (user_id = auth.uid());

create policy "telegram_links_update_own"
  on public.telegram_links for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "telegram_links_delete_own"
  on public.telegram_links for delete
  using (user_id = auth.uid());

create policy "sync_logs_select_own"
  on public.sync_logs for select
  using (user_id = auth.uid());

create policy "sync_logs_insert_own"
  on public.sync_logs for insert
  with check (user_id = auth.uid());

create policy "sync_logs_update_own"
  on public.sync_logs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "sync_logs_delete_own"
  on public.sync_logs for delete
  using (user_id = auth.uid());