-- Inserta categorías predeterminadas para usuarios existentes.
-- No se crean datos financieros falsos (ver Desarrollo #50).
do $$
declare
  user_record record;
begin
  for user_record in select id from auth.users
  loop
    perform public.ensure_default_categories(user_record.id);
  end loop;
end;
$$;