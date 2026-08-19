-- Presupuesto mensual por categoría (opcional): límite de gasto mensual
-- en la moneda principal del usuario (PEN). Si es null, la categoría no
-- tiene presupuesto.
alter table public.categories
  add column if not exists monthly_budget numeric(14, 2) check (monthly_budget >= 0);