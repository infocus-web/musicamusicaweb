-- La cuenta principal del taller no se puede borrar del personal ni pasar a técnico (ni desde el panel ni por error).
create or replace function public.proteger_cuenta_principal()
returns trigger language plpgsql set search_path = '' as $$
begin
  if lower(coalesce(old.email, '')) = 'tallermusicamusicaweb@gmail.com' then
    if tg_op = 'DELETE' then
      raise exception 'La cuenta principal del taller no se puede quitar.';
    elsif new.rol <> 'admin' then
      raise exception 'La cuenta principal del taller tiene que seguir siendo administradora.';
    end if;
  end if;
  return coalesce(new, old);
end; $$;
revoke execute on function public.proteger_cuenta_principal() from public, anon, authenticated;

drop trigger if exists staff_proteger_principal on public.staff;
create trigger staff_proteger_principal before update or delete on public.staff
for each row execute function public.proteger_cuenta_principal();
