-- Musica Musica Web — base del taller
-- Clientes (con código y link privado), instrumentos, trabajos (órdenes) y avances (fotos/videos).

-- ---------- Personal del taller ----------
create table public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  creado_en timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff s where s.user_id = (select auth.uid()));
$$;

-- ---------- Clientes ----------
create sequence public.clientes_codigo_seq;

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique
    default ('MM-' || lpad(nextval('public.clientes_codigo_seq')::text, 4, '0')),
  nombre text not null,
  telefono text,
  email text,
  notas text,
  -- token del link privado de seguimiento (difícil de adivinar)
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  creado_en timestamptz not null default now()
);

-- ---------- Instrumentos ----------
create table public.instrumentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  tipo text not null,          -- guitarra, bajo, violín, batería, etc.
  marca text,
  modelo text,
  numero_serie text,
  notas text,
  creado_en timestamptz not null default now()
);
create index instrumentos_cliente_idx on public.instrumentos(cliente_id);

-- ---------- Trabajos (órdenes de trabajo) ----------
create sequence public.trabajos_numero_seq;

create table public.trabajos (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique
    default ('OT-' || lpad(nextval('public.trabajos_numero_seq')::text, 5, '0')),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  instrumento_id uuid references public.instrumentos(id) on delete set null,
  servicio text not null,       -- puesta a punto, calibración, reparación...
  problema text,                -- lo que describe el cliente
  estado text not null default 'recibido' check (estado in (
    'recibido', 'en_revision', 'esperando_aprobacion', 'esperando_repuesto',
    'en_trabajo', 'listo', 'entregado', 'cancelado'
  )),
  presupuesto numeric(12,2),
  presupuesto_aprobado boolean not null default false,
  fecha_ingreso date not null default current_date,
  fecha_estimada date,
  fecha_entrega date,
  notas_internas text,          -- nunca se muestran al cliente
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index trabajos_cliente_idx on public.trabajos(cliente_id);
create index trabajos_instrumento_idx on public.trabajos(instrumento_id);
create index trabajos_estado_idx on public.trabajos(estado);

create or replace function public.tocar_actualizado_en()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger trabajos_actualizado_en
before update on public.trabajos
for each row execute function public.tocar_actualizado_en();

-- ---------- Avances (novedades con foto/video) ----------
create table public.avances (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid not null references public.trabajos(id) on delete cascade,
  estado text,                  -- estado del trabajo al momento del avance
  descripcion text,
  media_path text,              -- ruta en el bucket "avances"
  media_tipo text check (media_tipo in ('video', 'foto')),
  visible_cliente boolean not null default true,
  creado_en timestamptz not null default now()
);
create index avances_trabajo_idx on public.avances(trabajo_id);

-- ---------- Seguridad (RLS): solo el personal del taller ----------
-- El cliente NO accede a las tablas: la página de seguimiento lee en el servidor
-- validando el token del link privado.
alter table public.staff enable row level security;
alter table public.clientes enable row level security;
alter table public.instrumentos enable row level security;
alter table public.trabajos enable row level security;
alter table public.avances enable row level security;

create policy "staff ve su propio registro" on public.staff
  for select to authenticated using (user_id = (select auth.uid()));

create policy "staff gestiona clientes" on public.clientes
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff gestiona instrumentos" on public.instrumentos
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff gestiona trabajos" on public.trabajos
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff gestiona avances" on public.avances
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

-- ---------- Storage: bucket privado para fotos y videos ----------
-- El tamaño máximo por archivo lo define el plan de Supabase (Storage > Settings).
insert into storage.buckets (id, name, public)
values ('avances', 'avances', false)
on conflict (id) do nothing;

create policy "staff sube avances" on storage.objects
  for insert to authenticated with check (bucket_id = 'avances' and (select public.is_staff()));
create policy "staff lee avances" on storage.objects
  for select to authenticated using (bucket_id = 'avances' and (select public.is_staff()));
create policy "staff borra avances" on storage.objects
  for delete to authenticated using (bucket_id = 'avances' and (select public.is_staff()));
