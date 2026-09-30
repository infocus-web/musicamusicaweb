-- Sección "Usados": instrumentos usados revisados por el taller, pedidos de tasación y ajustes del sitio.

-- ---------- Ajustes del sitio (WhatsApp, dirección, horarios) ----------
create table public.ajustes (
  clave text primary key,
  valor text,
  actualizado_en timestamptz not null default now()
);
alter table public.ajustes enable row level security;
create policy "ajustes públicos" on public.ajustes for select to anon, authenticated using (true);
create policy "staff edita ajustes" on public.ajustes for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

insert into public.ajustes (clave, valor) values
  ('whatsapp', null),
  ('direccion', null),
  ('horarios', null),
  ('instagram', null)
on conflict do nothing;

-- ---------- Usados ----------
create sequence public.usados_codigo_seq;

create table public.usados (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default ('U-' || lpad(nextval('public.usados_codigo_seq')::text, 3, '0')),
  titulo text not null,
  categoria text not null,
  marca text,
  modelo text,
  anio int,
  condicion text not null default 'muy_bueno' check (condicion in ('impecable', 'muy_bueno', 'bueno', 'con_detalles', 'a_reparar')),
  precio numeric(14,2),
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  precio_negociable boolean not null default false,
  descripcion text,
  caracteristicas text,          -- una por línea
  incluye text,                  -- estuche, cables, caja original...
  revision text,                 -- qué revisó el taller (una por línea)
  garantia_dias int,
  acepta_permuta boolean not null default true,
  envio boolean not null default true,
  destacado boolean not null default false,
  estado text not null default 'borrador' check (estado in ('borrador', 'publicado', 'reservado', 'vendido')),
  fotos text[] not null default '{}',   -- rutas en el bucket "usados"; la primera es la portada
  publicado_en timestamptz,
  vendido_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index usados_estado_idx on public.usados(estado);
create index usados_categoria_idx on public.usados(categoria);

create trigger usados_actualizado_en before update on public.usados
for each row execute function public.tocar_actualizado_en();

alter table public.usados enable row level security;
-- El público ve lo publicado, reservado o vendido; los borradores solo el taller.
create policy "público ve usados publicados" on public.usados for select to anon, authenticated
  using (estado in ('publicado', 'reservado', 'vendido'));
create policy "staff gestiona usados" on public.usados for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Fotos de usados: bucket público (se muestran en la web), solo el taller sube o borra.
insert into storage.buckets (id, name, public) values ('usados', 'usados', true) on conflict (id) do nothing;
create policy "staff sube fotos de usados" on storage.objects for insert to authenticated
  with check (bucket_id = 'usados' and (select public.is_staff()));
create policy "staff borra fotos de usados" on storage.objects for delete to authenticated
  using (bucket_id = 'usados' and (select public.is_staff()));

-- ---------- Tasaciones: clientes que quieren vender o permutar ----------
create table public.tasaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text not null,
  email text,
  categoria text,
  marca text,
  modelo text,
  anio int,
  condicion text,
  descripcion text,
  quiere text not null default 'vender' check (quiere in ('vender', 'permutar', 'consignar')),
  interes text,                  -- si permuta: qué le interesa
  precio_pretendido text,
  fotos text[] not null default '{}',   -- rutas en el bucket privado "tasaciones"
  estado text not null default 'nueva' check (estado in ('nueva', 'contactado', 'cerrada')),
  notas_internas text,
  creado_en timestamptz not null default now()
);
alter table public.tasaciones enable row level security;
create policy "staff gestiona tasaciones" on public.tasaciones for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

insert into storage.buckets (id, name, public) values ('tasaciones', 'tasaciones', false) on conflict (id) do nothing;
create policy "staff lee fotos de tasaciones" on storage.objects for select to authenticated
  using (bucket_id = 'tasaciones' and (select public.is_staff()));
create policy "staff borra fotos de tasaciones" on storage.objects for delete to authenticated
  using (bucket_id = 'tasaciones' and (select public.is_staff()));

-- Secciones: Usados, Liquidación y Usados Premium; precio anterior para mostrar el descuento.
alter table public.usados
  add column if not exists seccion text not null default 'usados' check (seccion in ('usados', 'liquidacion', 'premium')),
  add column if not exists precio_anterior numeric(14,2);
alter table public.usados drop constraint if exists usados_condicion_check;
alter table public.usados add constraint usados_condicion_check
  check (condicion in ('nuevo', 'impecable', 'muy_bueno', 'bueno', 'con_detalles', 'a_reparar'));
create index if not exists usados_seccion_idx on public.usados(seccion);
