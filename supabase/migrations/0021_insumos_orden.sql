-- Insumos de stock usados en una orden de trabajo: descuentan stock y quedan en la orden.
create table public.trabajo_insumos (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid not null references public.trabajos(id) on delete cascade,
  producto_id uuid references public.productos(id) on delete set null,
  variante_id uuid references public.variantes(id) on delete set null,
  nombre text not null,
  cantidad int not null check (cantidad > 0),
  precio numeric(14,2),            -- precio de venta al momento (para el presupuesto)
  costo numeric(14,2),             -- costo al momento (para la ganancia)
  creado_en timestamptz not null default now()
);
create index trabajo_insumos_trabajo_idx on public.trabajo_insumos(trabajo_id);
create index trabajo_insumos_producto_idx on public.trabajo_insumos(producto_id);
create index trabajo_insumos_variante_idx on public.trabajo_insumos(variante_id);
alter table public.trabajo_insumos enable row level security;
create policy "staff ve insumos de orden" on public.trabajo_insumos for select to authenticated using ((select public.is_staff()));

-- Usar un insumo: descuenta stock (si no alcanza, avisa) y lo anota en la orden.
create or replace function public.usar_insumo(p_trabajo uuid, p_producto uuid, p_variante uuid, p_cantidad int)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_num text; v_nombre text; v_precio numeric; v_costo numeric; v_stock int; v_id uuid;
begin
  if not public.is_staff() then raise exception 'Sin permiso'; end if;
  if p_cantidad is null or p_cantidad <= 0 then raise exception 'Cantidad inválida'; end if;
  select numero into v_num from public.trabajos where id = p_trabajo;
  if v_num is null then raise exception 'Orden inexistente'; end if;
  select p.nombre || coalesce(' — ' || v.nombre, ''), coalesce(v.precio, p.precio), coalesce(v.stock, p.stock)
    into v_nombre, v_precio, v_stock
    from public.productos p left join public.variantes v on v.id = p_variante and v.producto_id = p.id
   where p.id = p_producto and p.tipo = 'producto' and (p_variante is null or v.id is not null);
  if v_nombre is null then raise exception 'Producto inexistente'; end if;
  if v_stock < p_cantidad then raise exception 'No hay stock suficiente (quedan %)', v_stock; end if;
  select c.costo into v_costo from public.costos c where c.producto_id = p_producto and c.variante_id is not distinct from p_variante;

  perform set_config('app.stock_motivo', 'venta', true);   -- salida por uso en la orden (ref = OT)
  perform set_config('app.stock_ref', v_num, true);
  if p_variante is not null then update public.variantes set stock = stock - p_cantidad where id = p_variante;
  else update public.productos set stock = stock - p_cantidad where id = p_producto;
  end if;
  insert into public.trabajo_insumos (trabajo_id, producto_id, variante_id, nombre, cantidad, precio, costo)
  values (p_trabajo, p_producto, p_variante, v_nombre, p_cantidad, v_precio, v_costo) returning id into v_id;
  return v_id;
end; $$;
revoke execute on function public.usar_insumo(uuid, uuid, uuid, int) from public, anon;
grant execute on function public.usar_insumo(uuid, uuid, uuid, int) to authenticated;

-- Quitar un insumo cargado por error: devuelve el stock.
create or replace function public.quitar_insumo(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare r record; v_num text;
begin
  if not public.is_staff() then raise exception 'Sin permiso'; end if;
  select * into r from public.trabajo_insumos where id = p_id;
  if r.id is null then return; end if;
  select numero into v_num from public.trabajos where id = r.trabajo_id;
  perform set_config('app.stock_motivo', 'cancelacion', true);
  perform set_config('app.stock_ref', coalesce(v_num, ''), true);
  if r.variante_id is not null then update public.variantes set stock = stock + r.cantidad where id = r.variante_id;
  elsif r.producto_id is not null then update public.productos set stock = stock + r.cantidad where id = r.producto_id;
  end if;
  delete from public.trabajo_insumos where id = p_id;
end; $$;
revoke execute on function public.quitar_insumo(uuid) from public, anon;
grant execute on function public.quitar_insumo(uuid) to authenticated;

-- Datos fiscales para los comprobantes (se cargan en Ajustes).
insert into public.ajustes (clave, valor) values ('razon_social', null), ('cuit', null), ('condicion_fiscal', 'Monotributo')
on conflict do nothing;
