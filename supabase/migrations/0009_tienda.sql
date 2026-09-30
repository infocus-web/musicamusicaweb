-- E-shop: productos con variantes y stock, envíos, pedidos y funciones de stock.

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  tipo text not null default 'producto' check (tipo in ('producto', 'servicio')),
  categoria text not null default 'accesorios',
  marca text,
  descripcion text,
  precio numeric(14,2) not null default 0,
  precio_anterior numeric(14,2),
  stock int not null default 0,
  sin_stock_vende boolean not null default false,
  fotos text[] not null default '{}',
  activo boolean not null default false,
  destacado boolean not null default false,
  sku text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index productos_categoria_idx on public.productos(categoria);
create trigger productos_actualizado_en before update on public.productos for each row execute function public.tocar_actualizado_en();

create table public.variantes (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  nombre text not null,
  precio numeric(14,2),
  stock int not null default 0,
  sku text,
  orden int not null default 0
);
create index variantes_producto_idx on public.variantes(producto_id);

alter table public.productos enable row level security;
alter table public.variantes enable row level security;
create policy "público ve productos activos" on public.productos for select to anon, authenticated using (activo);
create policy "staff gestiona productos" on public.productos for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "público ve variantes" on public.variantes for select to anon, authenticated using (exists (select 1 from public.productos p where p.id = producto_id and p.activo));
create policy "staff gestiona variantes" on public.variantes for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

insert into storage.buckets (id, name, public) values ('productos', 'productos', true) on conflict (id) do nothing;
create policy "staff sube fotos productos" on storage.objects for insert to authenticated with check (bucket_id = 'productos' and (select public.is_staff()));
create policy "staff borra fotos productos" on storage.objects for delete to authenticated using (bucket_id = 'productos' and (select public.is_staff()));

create table public.envios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null check (tipo in ('retiro', 'fijo', 'correo', 'moto')),
  precio numeric(14,2) not null default 0,
  gratis_desde numeric(14,2),
  detalle text,
  activo boolean not null default true,
  orden int not null default 0
);
alter table public.envios enable row level security;
create policy "público ve envíos activos" on public.envios for select to anon, authenticated using (activo);
create policy "staff gestiona envíos" on public.envios for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
insert into public.envios (nombre, tipo, precio, detalle, orden) values
  ('Retiro en el local', 'retiro', 0, 'Te avisamos por WhatsApp cuando esté listo.', 1),
  ('Moto / cadete en la zona', 'moto', 0, 'Coordinamos día y costo por WhatsApp.', 2),
  ('Envío a domicilio', 'fijo', 0, 'Costo fijo. Cargalo en el panel.', 3),
  ('Correo Argentino / Andreani', 'correo', 0, 'Te cotizamos el envío antes de pagar.', 4);

create sequence public.pedidos_numero_seq;
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default ('P-' || lpad(nextval('public.pedidos_numero_seq')::text, 5, '0')),
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  cliente_id uuid references public.clientes(id) on delete set null,
  nombre text not null,
  telefono text not null,
  email text,
  dni text,
  envio_id uuid references public.envios(id) on delete set null,
  envio_nombre text,
  envio_tipo text,
  envio_costo numeric(14,2),
  direccion text,
  localidad text,
  provincia text,
  codigo_postal text,
  pago_metodo text not null check (pago_metodo in ('mercadopago', 'transferencia', 'efectivo')),
  subtotal numeric(14,2) not null,
  descuento numeric(14,2) not null default 0,
  total numeric(14,2) not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'a_cotizar', 'pagado', 'preparando', 'enviado', 'listo_retirar', 'entregado', 'cancelado')),
  pago_estado text not null default 'pendiente' check (pago_estado in ('pendiente', 'aprobado', 'rechazado', 'devuelto')),
  mp_preference_id text,
  mp_payment_id text,
  notas text,
  notas_internas text,
  seguimiento_envio text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create trigger pedidos_actualizado_en before update on public.pedidos for each row execute function public.tocar_actualizado_en();

create table public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  producto_id uuid references public.productos(id) on delete set null,
  variante_id uuid references public.variantes(id) on delete set null,
  usado_id uuid references public.usados(id) on delete set null,
  nombre text not null,
  precio numeric(14,2) not null,
  cantidad int not null check (cantidad > 0)
);
create index pedido_items_pedido_idx on public.pedido_items(pedido_id);

alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
create policy "staff gestiona pedidos" on public.pedidos for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff gestiona items" on public.pedido_items for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create or replace function public.descontar_stock(p_producto uuid, p_variante uuid, p_cantidad int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare ok boolean;
begin
  if p_variante is not null then
    update public.variantes v set stock = v.stock - p_cantidad
    where v.id = p_variante and (v.stock >= p_cantidad or exists (select 1 from public.productos p where p.id = v.producto_id and p.sin_stock_vende))
    returning true into ok;
  else
    update public.productos p set stock = p.stock - p_cantidad
    where p.id = p_producto and (p.tipo = 'servicio' or p.sin_stock_vende or p.stock >= p_cantidad)
    returning true into ok;
  end if;
  return coalesce(ok, false);
end; $$;
revoke execute on function public.descontar_stock(uuid, uuid, int) from public, anon, authenticated;

create or replace function public.devolver_stock(p_producto uuid, p_variante uuid, p_cantidad int)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_variante is not null then update public.variantes set stock = stock + p_cantidad where id = p_variante;
  elsif p_producto is not null then update public.productos set stock = stock + p_cantidad where id = p_producto and tipo = 'producto';
  end if;
end; $$;
revoke execute on function public.devolver_stock(uuid, uuid, int) from public, anon, authenticated;

alter table public.usados add column if not exists venta_online boolean not null default true;

insert into public.ajustes (clave, valor) values ('transferencia_datos', null), ('transferencia_descuento', null) on conflict do nothing;
