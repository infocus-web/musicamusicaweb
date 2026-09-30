-- Roles del personal y acceso de clientes con código + clave.

-- ---------- Personal: rol y datos ----------
alter table public.staff
  add column if not exists rol text not null default 'tecnico' check (rol in ('admin', 'tecnico')),
  add column if not exists email text;

update public.staff s set email = u.email from auth.users u where u.id = s.user_id and s.email is null;

-- El email principal del taller entra como administrador.
create or replace function public.alta_staff_taller()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if lower(new.email) = 'tallermusicamusicaweb@gmail.com' then
    insert into public.staff (user_id, nombre, rol, email)
    values (new.id, 'Taller', 'admin', new.email)
    on conflict (user_id) do update set rol = 'admin';
  end if;
  return new;
end; $$;
revoke execute on function public.alta_staff_taller() from public, anon, authenticated;

update public.staff s set rol = 'admin'
from auth.users u where u.id = s.user_id and lower(u.email) = 'tallermusicamusicaweb@gmail.com';

-- ---------- Clientes: usuario para entrar con código + clave ----------
alter table public.clientes
  add column if not exists user_id uuid unique references auth.users(id) on delete set null;
