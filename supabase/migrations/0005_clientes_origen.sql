-- De dónde vino cada cliente y si el taller ya revisó su registro.
alter table public.clientes
  add column if not exists origen text not null default 'taller' check (origen in ('taller', 'registro', 'importado')),
  add column if not exists revisado boolean not null default true;

-- Teléfono normalizado (últimos 10 dígitos) para encontrar clientes repetidos.
alter table public.clientes
  add column if not exists telefono_norm text generated always as (right(regexp_replace(coalesce(telefono, ''), '\D', '', 'g'), 10)) stored;
create index if not exists clientes_telefono_norm_idx on public.clientes(telefono_norm);
