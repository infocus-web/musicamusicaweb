-- Panel del cliente: chat con el taller, aprobaciones de presupuesto y novedades.
-- Los clientes NO leen estas tablas directo: el servidor valida su sesión y usa la clave de servicio.

-- ---------- Chat (uno por cliente) ----------
create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  trabajo_id uuid references public.trabajos(id) on delete set null,   -- de qué orden habla (opcional)
  autor text not null check (autor in ('cliente', 'taller')),
  staff_id uuid,                                                       -- quién del taller respondió
  tipo text not null default 'texto' check (tipo in ('texto', 'turno', 'aprobacion', 'sistema')),
  texto text not null check (char_length(texto) between 1 and 4000),
  leido_taller boolean not null default false,
  leido_cliente boolean not null default false,
  creado_en timestamptz not null default now()
);
create index mensajes_cliente_idx on public.mensajes(cliente_id, creado_en);
create index mensajes_trabajo_idx on public.mensajes(trabajo_id);
create index mensajes_sin_leer_taller_idx on public.mensajes(leido_taller) where not leido_taller;
alter table public.mensajes enable row level security;
create policy "staff gestiona mensajes" on public.mensajes for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- ---------- Aprobaciones (presupuesto inicial y ampliaciones) ----------
create table public.aprobaciones (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid not null references public.trabajos(id) on delete cascade,
  tipo text not null check (tipo in ('presupuesto', 'ampliacion')),
  monto numeric(14,2) not null check (monto >= 0),
  detalle text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada', 'anulada')),
  respuesta text,                       -- comentario del cliente al responder
  respondida_en timestamptz,
  staff_id uuid default auth.uid(),
  creado_en timestamptz not null default now()
);
create index aprobaciones_trabajo_idx on public.aprobaciones(trabajo_id);
create index aprobaciones_pendientes_idx on public.aprobaciones(estado) where estado = 'pendiente';
alter table public.aprobaciones enable row level security;
create policy "staff gestiona aprobaciones" on public.aprobaciones for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- ---------- Novedades del taller (las ven todos los clientes en su panel) ----------
create table public.novedades (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  texto text,
  link text,
  publicada boolean not null default true,
  creado_en timestamptz not null default now()
);
create index novedades_fecha_idx on public.novedades(creado_en desc);
alter table public.novedades enable row level security;
create policy "staff gestiona novedades" on public.novedades for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
