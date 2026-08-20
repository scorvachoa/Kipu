-- Categorías globales: user_id = NULL, fijas para todos los usuarios.
-- Bloquea la creación/edición/borrado por parte de usuarios (solo lectura).

-- 1) Permitir categorías sin dueño (globales).
alter table public.categories alter column user_id drop not null;

-- 2) Conjunto global de categorías (idempotente).
insert into public.categories (user_id, name, icon, color, active)
select null, name, icon, color, true
from (
  values
    ('Alimentación', 'Utensils', '#22c55e'),
    ('Supermercado', 'ShoppingCart', '#8b5cf6'),
    ('Restaurantes', 'UtensilsCrossed', '#ef4444'),
    ('Transporte', 'Car', '#0ea5e9'),
    ('Combustible', 'Zap', '#f97316'),
    ('Compras', 'Store', '#ec4899'),
    ('Ropa', 'Shirt', '#d946ef'),
    ('Entretenimiento', 'Clapperboard', '#a855f7'),
    ('Servicios', 'Receipt', '#f59e0b'),
    ('Salud', 'HeartPulse', '#10b981'),
    ('Educación', 'GraduationCap', '#3b82f6'),
    ('Viajes', 'Plane', '#06b6d4'),
    ('Suscripciones', 'Repeat', '#6366f1'),
    ('Hogar', 'Home', '#eab308'),
    ('Mascotas', 'Dog', '#f97316'),
    ('Finanzas', 'Landmark', '#14b8a6'),
    ('Otros', 'MoreHorizontal', '#64748b')
) as defaults (name, icon, color)
where not exists (
  select 1 from public.categories c
  where c.user_id is null and c.name = defaults.name
);

create unique index categories_global_name_unique
  on public.categories (name)
  where user_id is null;

-- 3) El alta de un usuario nuevo ya no crea categorías propias:
--    garantiza únicamente el conjunto global.
create or replace function public.ensure_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.categories (user_id, name, icon, color, active)
  select null, name, icon, color, true
  from (
    values
      ('Alimentación', 'Utensils', '#22c55e'),
      ('Supermercado', 'ShoppingCart', '#8b5cf6'),
      ('Restaurantes', 'UtensilsCrossed', '#ef4444'),
      ('Transporte', 'Car', '#0ea5e9'),
      ('Combustible', 'Zap', '#f97316'),
      ('Compras', 'Store', '#ec4899'),
      ('Ropa', 'Shirt', '#d946ef'),
      ('Entretenimiento', 'Clapperboard', '#a855f7'),
      ('Servicios', 'Receipt', '#f59e0b'),
      ('Salud', 'HeartPulse', '#10b981'),
      ('Educación', 'GraduationCap', '#3b82f6'),
      ('Viajes', 'Plane', '#06b6d4'),
      ('Suscripciones', 'Repeat', '#6366f1'),
      ('Hogar', 'Home', '#eab308'),
      ('Mascotas', 'Dog', '#f97316'),
      ('Finanzas', 'Landmark', '#14b8a6'),
      ('Otros', 'MoreHorizontal', '#64748b')
  ) as defaults (name, icon, color)
  where not exists (
    select 1 from public.categories c
    where c.user_id is null and c.name = defaults.name
  );
end;
$$;

-- 4) Migrar transacciones: categorías de usuario con mismo nombre -> global.
update public.transactions t
set category_id = g.id
from public.categories u
join public.categories g on g.user_id is null and lower(g.name) = lower(u.name)
where u.user_id is not null and t.category_id = u.id;

-- 5) Categorías de usuario sin equivalente global -> "Otros".
update public.transactions t
set category_id = ot.id
from lateral (
  select id from public.categories where user_id is null and name = 'Otros' limit 1
) ot
where t.category_id in (select id from public.categories u where u.user_id is not null)
  and not exists (
    select 1 from public.categories uu
    join public.categories g on g.user_id is null and lower(g.name) = lower(uu.name)
    where uu.id = t.category_id
  );

-- 6) Reglas de comercio: mismas dos pasadas.
update public.merchant_rules r
set category_id = g.id
from public.categories u
join public.categories g on g.user_id is null and lower(g.name) = lower(u.name)
where u.user_id is not null and r.category_id = u.id;

update public.merchant_rules r
set category_id = ot.id
from lateral (
  select id from public.categories where user_id is null and name = 'Otros' limit 1
) ot
where r.category_id in (select id from public.categories u where u.user_id is not null)
  and not exists (
    select 1 from public.categories uu
    join public.categories g on g.user_id is null and lower(g.name) = lower(uu.name)
    where uu.id = r.category_id
  );

-- 7) Eliminar las categorías por usuario (ya reasignadas).
delete from public.categories where user_id is not null;

-- 8) RLS: solo lectura (globales + propias), sin insert/update/delete por usuarios.
drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_global_or_own"
  on public.categories for select
  using (user_id is null or user_id = auth.uid());

drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;