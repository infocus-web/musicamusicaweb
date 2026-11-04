-- Etapa 2: avisos para mandar por WhatsApp, agenda de turnos y fecha en que quedó "listo".

-- ---------- Avisos pendientes (los genera la base sola; el taller los manda por WhatsApp con un toque) ----------
create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  trabajo_id uuid references public.trabajos(id) on delete cascade,
  tipo text not null check (tipo in ('estado', 'fotos', 'aprobacion', 'turno', 'respuesta')),
  dato text,                         -- estado nuevo, fecha del turno, etc.
  creado_en timestamptz not null default now(),
  enviado_en timestamptz,
  descartado boolean not null default false
);
create index avisos_pendientes_idx on public.avisos(cliente_id) where enviado_en is null and not descartado;
create index avisos_trabajo_idx on public.avisos(trabajo_id);
alter table public.avisos enable row level security;
create policy "staff gestiona avisos" on public.avisos for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Cambio de estado de una orden → aviso (y guarda cuándo quedó lista)
alter table public.trabajos add column if not exists listo_en timestamptz;

create or replace function public.trabajo_cambio_estado()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.estado is distinct from old.estado then
    if new.estado = 'listo' then new.listo_en := now(); end if;
    if new.estado in ('en_revision', 'esperando_repuesto', 'en_trabajo', 'listo', 'entregado') then
      -- un solo aviso de estado pendiente por orden (se reemplaza por el último)
      delete from public.avisos where trabajo_id = new.id and tipo = 'estado' and enviado_en is null;
      insert into public.avisos (cliente_id, trabajo_id, tipo, dato) values (new.cliente_id, new.id, 'estado', new.estado);
    end if;
  end if;
  return new;
end; $$;
revoke execute on function public.trabajo_cambio_estado() from public, anon, authenticated;
create trigger trabajos_cambio_estado before update of estado on public.trabajos
  for each row execute function public.trabajo_cambio_estado();

-- Foto o video nuevo visible para el cliente → aviso (uno por orden mientras no se mande)
create or replace function public.avance_con_media()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_cliente uuid;
begin
  if new.media_path is not null and new.visible_cliente then
    select cliente_id into v_cliente from public.trabajos where id = new.trabajo_id;
    if not exists (select 1 from public.avisos where trabajo_id = new.trabajo_id and tipo = 'fotos' and enviado_en is null and not descartado) then
      insert into public.avisos (cliente_id, trabajo_id, tipo) values (v_cliente, new.trabajo_id, 'fotos');
    end if;
  end if;
  return new;
end; $$;
revoke execute on function public.avance_con_media() from public, anon, authenticated;
create trigger avances_con_media after insert on public.avances
  for each row execute function public.avance_con_media();

-- Pedido de aprobación → aviso
create or replace function public.aprobacion_pedida()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_cliente uuid;
begin
  select cliente_id into v_cliente from public.trabajos where id = new.trabajo_id;
  insert into public.avisos (cliente_id, trabajo_id, tipo, dato) values (v_cliente, new.trabajo_id, 'aprobacion', new.monto::text);
  return new;
end; $$;
revoke execute on function public.aprobacion_pedida() from public, anon, authenticated;
create trigger aprobaciones_pedida after insert on public.aprobaciones
  for each row execute function public.aprobacion_pedida();

-- ---------- Turnos ----------
create table public.turnos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  fecha date not null,
  hora text,                         -- "17:30" (lo pone el taller al confirmar)
  franja text,                       -- lo que pidió el cliente: mañana / tarde / me da igual
  modo text,                         -- lo lleva / retiro a domicilio / correo
  motivo text,
  estado text not null default 'pedido' check (estado in ('pedido', 'confirmado', 'realizado', 'cancelado')),
  origen text not null default 'cliente' check (origen in ('cliente', 'taller')),
  creado_en timestamptz not null default now()
);
create index turnos_fecha_idx on public.turnos(fecha);
create index turnos_cliente_idx on public.turnos(cliente_id);
alter table public.turnos enable row level security;
create policy "staff gestiona turnos" on public.turnos for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Respuestas rápidas del chat (una por línea, se editan en el panel)
insert into public.ajustes (clave, valor) values ('respuestas_rapidas',
  E'¡Hola! Ya lo estamos revisando, en un rato te paso novedades.\nTu instrumento ya está listo para retirar. ¿Qué día te queda bien?\nTe paso el presupuesto en el día de hoy.\nEstamos esperando un repuesto, apenas llegue seguimos.\n¡Gracias por elegirnos! Cualquier cosa, escribinos.')
on conflict do nothing;
