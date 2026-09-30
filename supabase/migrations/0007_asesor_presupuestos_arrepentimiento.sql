-- Asesor, "¿ya te pasaron un presupuesto?", botón de arrepentimiento y textos editables.

-- Los pedidos de "mejoramos tu presupuesto" usan la misma tabla que las tasaciones.
alter table public.tasaciones
  add column if not exists tipo text not null default 'usado' check (tipo in ('usado', 'presupuesto'));

-- Respuestas del asesor (para saber qué buscan los clientes).
create table public.asesor_consultas (
  id uuid primary key default gen_random_uuid(),
  objetivo text,
  respuestas jsonb not null default '{}',
  creado_en timestamptz not null default now()
);
alter table public.asesor_consultas enable row level security;
create policy "staff ve consultas del asesor" on public.asesor_consultas for select to authenticated using ((select public.is_staff()));

-- Botón de arrepentimiento (Res. 424/2020): cada pedido recibe un código de trámite.
create sequence public.arrepentimientos_codigo_seq;
create table public.arrepentimientos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default ('AR-' || lpad(nextval('public.arrepentimientos_codigo_seq')::text, 5, '0')),
  nombre text not null,
  email text,
  telefono text,
  referencia text,
  detalle text,
  estado text not null default 'recibido' check (estado in ('recibido', 'en_proceso', 'resuelto')),
  creado_en timestamptz not null default now()
);
alter table public.arrepentimientos enable row level security;
create policy "staff gestiona arrepentimientos" on public.arrepentimientos for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

insert into public.ajustes (clave, valor) values ('email', null), ('quienes_somos', null), ('terminos', null) on conflict do nothing;
