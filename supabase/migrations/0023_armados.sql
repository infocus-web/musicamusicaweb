-- "Armá tu instrumento": el cliente arma desde su panel un instrumento a medida, parte por parte,
-- y el taller se lo presupuesta. Los clientes NO leen estas tablas directo: el servidor valida
-- su sesión (o su link privado) y usa la clave de servicio, igual que el resto del panel.

create table public.armados (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 120),          -- "Mi Strato custom"
  tipo text,                                                                     -- Guitarra eléctrica, Bajo…
  notas text check (notas is null or char_length(notas) <= 4000),
  -- borrador: lo está armando · enviado: pidió presupuesto · presupuestado: el taller pasó el valor
  -- aprobado / rechazado: respuesta del cliente · cancelado: lo dio de baja
  estado text not null default 'borrador'
    check (estado in ('borrador', 'enviado', 'presupuestado', 'aprobado', 'rechazado', 'cancelado')),
  presupuesto numeric(14,2) check (presupuesto is null or presupuesto >= 0),
  detalle_presupuesto text,                                                      -- nota del taller (plazos, seña, etc.)
  respuesta text,                                                                -- comentario del cliente al responder
  enviado_en timestamptz,
  presupuestado_en timestamptz,
  respondido_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index armados_cliente_idx on public.armados(cliente_id, actualizado_en desc);
create index armados_enviados_idx on public.armados(estado) where estado = 'enviado';
alter table public.armados enable row level security;
create policy "staff gestiona armados" on public.armados for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create table public.armado_partes (
  id uuid primary key default gen_random_uuid(),
  armado_id uuid not null references public.armados(id) on delete cascade,
  parte text not null check (char_length(parte) between 1 and 80),               -- Cuerpo, Mástil, Pastillas…
  nombre text not null check (char_length(nombre) between 1 and 160),            -- marca / producto
  modelo text check (modelo is null or char_length(modelo) <= 160),
  link text check (link is null or (char_length(link) <= 1000 and link ~* '^https?://')),
  notas text check (notas is null or char_length(notas) <= 1000),
  precio numeric(14,2) check (precio is null or precio >= 0),                    -- lo carga el taller (opcional)
  orden int not null default 0,
  creado_en timestamptz not null default now()
);
create index armado_partes_armado_idx on public.armado_partes(armado_id, orden);
alter table public.armado_partes enable row level security;
create policy "staff gestiona partes de armados" on public.armado_partes for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
