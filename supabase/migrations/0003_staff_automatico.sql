-- Quien se registre con el email del taller queda habilitado como personal automáticamente.
create or replace function public.alta_staff_taller()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if lower(new.email) = 'tallermusicamusicaweb@gmail.com' then
    insert into public.staff (user_id, nombre) values (new.id, 'Taller') on conflict do nothing;
  end if;
  return new;
end; $$;
revoke execute on function public.alta_staff_taller() from public, anon, authenticated;
create trigger alta_staff_taller after insert on auth.users
for each row execute function public.alta_staff_taller();
