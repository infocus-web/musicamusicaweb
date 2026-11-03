-- Gestión: costos, proveedores, compras, movimientos de stock, cobros de órdenes y comprobantes internos.
-- Solo agrega tablas, columnas y funciones. No borra datos.

-- ---------- Rol administrador ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff s where s.user_id = (select auth.uid()) and s.rol = 'admin');
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------- Costos (tabla aparte: productos y variantes son públicos y el costo no se debe ver) ----------
create table public.costos (
  producto_id uuid not null references public.productos(id) on delete cascade,
  variante_id uuid references public.variantes(id) on delete cascade,
  costo numeric(14,2) not null check (costo >= 0),
  actualizado_en timestamptz not null default now(),
  constraint costos_item_uq unique nulls not distinct (producto_id, variante_id)
);
create index costos_variante_idx on public.costos(variante_id);
alter table public.costos enable row level security;
create policy "admin gestiona costos" on public.costos for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Costo al momento de la venta (para calcular ganancia aunque después cambie).
alter table public.pedido_items add column if not exists costo numeric(14,2);

create or replace function public.pedido_item_costo()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.costo is null and new.producto_id is not null then
    select c.costo into new.costo from public.costos c
     where c.producto_id = new.producto_id and c.variante_id is not distinct from new.variante_id;
    if new.costo is null and new.variante_id is not null then
      select c.costo into new.costo from public.costos c where c.producto_id = new.producto_id and c.variante_id is null;
    end if;
  end if;
  return new;
end; $$;
create trigger pedido_items_costo before insert on public.pedido_items
  for each row execute function public.pedido_item_costo();

-- Producto recién creado que todavía no se guardó nunca (se puede descartar).
alter table public.productos add column if not exists borrador boolean not null default false;

-- Fecha en que se aprobó el pago (las ventas se cuentan por esta fecha).
alter table public.pedidos add column if not exists pagado_en timestamptz;
update public.pedidos set pagado_en = actualizado_en where pago_estado = 'aprobado' and pagado_en is null;
create index if not exists pedidos_pagado_en_idx on public.pedidos(pagado_en);

create or replace function public.pedido_pagado_en()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.pago_estado = 'aprobado' and new.pagado_en is null then new.pagado_en := now(); end if;
  return new;
end; $$;
create trigger pedidos_pagado_en before insert or update of pago_estado on public.pedidos
  for each row execute function public.pedido_pagado_en();

-- ---------- Movimientos de stock (los registra un trigger, nadie los escribe a mano) ----------
create table public.stock_movimientos (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  variante_id uuid references public.variantes(id) on delete set null,
  cantidad int not null,              -- + entra, − sale
  stock_resultante int not null,
  motivo text not null check (motivo in ('inicial', 'compra', 'venta', 'cancelacion', 'ajuste')),
  referencia text,                    -- P-00012, C-00003...
  nota text,
  usuario_id uuid,                    -- null = automático (tienda online)
  creado_en timestamptz not null default now()
);
create index stock_mov_producto_idx on public.stock_movimientos(producto_id, creado_en desc);
create index stock_mov_variante_idx on public.stock_movimientos(variante_id);
create index stock_mov_fecha_idx on public.stock_movimientos(creado_en desc);
alter table public.stock_movimientos enable row level security;
create policy "admin ve movimientos" on public.stock_movimientos for select to authenticated using ((select public.is_admin()));

create or replace function public.registrar_mov_stock()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_delta int; v_prod uuid; v_var uuid;
begin
  v_delta := case when tg_op = 'INSERT' then new.stock else new.stock - old.stock end;
  if v_delta = 0 then return new; end if;
  if tg_table_name = 'variantes' then
    v_prod := new.producto_id; v_var := new.id;
  else
    if new.tipo = 'servicio' then return new; end if;
    v_prod := new.id; v_var := null;
  end if;
  insert into public.stock_movimientos (producto_id, variante_id, cantidad, stock_resultante, motivo, referencia, nota, usuario_id)
  values (
    v_prod, v_var, v_delta, new.stock,
    coalesce(nullif(current_setting('app.stock_motivo', true), ''), case when tg_op = 'INSERT' then 'inicial' else 'ajuste' end),
    nullif(current_setting('app.stock_ref', true), ''),
    nullif(current_setting('app.stock_nota', true), ''),
    auth.uid()
  );
  return new;
end; $$;
create trigger productos_mov_stock after insert or update of stock on public.productos
  for each row execute function public.registrar_mov_stock();
create trigger variantes_mov_stock after insert or update of stock on public.variantes
  for each row execute function public.registrar_mov_stock();

-- Las funciones de la tienda marcan el movimiento como venta / cancelación (misma firma que antes).
create or replace function public.descontar_stock(p_producto uuid, p_variante uuid, p_cantidad int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare ok boolean;
begin
  perform set_config('app.stock_motivo', 'venta', true);
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
  perform set_config('app.stock_motivo', 'cancelacion', true);
  if p_variante is not null then update public.variantes set stock = stock + p_cantidad where id = p_variante;
  elsif p_producto is not null then update public.productos set stock = stock + p_cantidad where id = p_producto and tipo = 'producto';
  end if;
end; $$;
revoke execute on function public.devolver_stock(uuid, uuid, int) from public, anon, authenticated;

-- Ajuste manual con motivo (rotura, conteo, regalo...).
create or replace function public.ajustar_stock(p_producto uuid, p_variante uuid, p_nuevo int, p_nota text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede ajustar stock'; end if;
  if p_nuevo is null then raise exception 'Falta la cantidad'; end if;
  perform set_config('app.stock_motivo', 'ajuste', true);
  perform set_config('app.stock_nota', coalesce(p_nota, ''), true);
  if p_variante is not null then
    update public.variantes set stock = p_nuevo where id = p_variante and producto_id = p_producto;
  else
    update public.productos set stock = p_nuevo where id = p_producto and tipo = 'producto';
  end if;
end; $$;
revoke execute on function public.ajustar_stock(uuid, uuid, int, text) from public, anon;
grant execute on function public.ajustar_stock(uuid, uuid, int, text) to authenticated;

-- ---------- Proveedores y compras ----------
create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cuit text,
  telefono text,
  email text,
  notas text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
alter table public.proveedores enable row level security;
create policy "admin gestiona proveedores" on public.proveedores for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create sequence public.compras_numero_seq;
create table public.compras (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default ('C-' || lpad(nextval('public.compras_numero_seq')::text, 5, '0')),
  proveedor_id uuid references public.proveedores(id) on delete set null,
  fecha date not null default current_date,
  comprobante text,                   -- número de factura/remito del proveedor
  total numeric(14,2) not null default 0,
  notas text,
  anulada boolean not null default false,
  usuario_id uuid default auth.uid(),
  creado_en timestamptz not null default now()
);
create index compras_fecha_idx on public.compras(fecha desc);
create index compras_proveedor_idx on public.compras(proveedor_id);
create table public.compra_items (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras(id) on delete cascade,
  producto_id uuid references public.productos(id) on delete set null,
  variante_id uuid references public.variantes(id) on delete set null,
  nombre text not null,
  cantidad int not null check (cantidad > 0),
  costo_unitario numeric(14,2) not null check (costo_unitario >= 0)
);
create index compra_items_compra_idx on public.compra_items(compra_id);
create index compra_items_producto_idx on public.compra_items(producto_id);
create index compra_items_variante_idx on public.compra_items(variante_id);
alter table public.compras enable row level security;
alter table public.compra_items enable row level security;
create policy "admin ve compras" on public.compras for select to authenticated using ((select public.is_admin()));
create policy "admin edita compras" on public.compras for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin ve items de compras" on public.compra_items for select to authenticated using ((select public.is_admin()));

-- Registra la compra entera en una sola transacción: ítems, suma stock y actualiza el costo.
-- p_items: [{ "producto_id": uuid, "variante_id": uuid|null, "cantidad": int, "costo": numeric }]
create or replace function public.registrar_compra(p_proveedor uuid, p_fecha date, p_comprobante text, p_notas text, p_items jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid; v_num text; it jsonb; v_prod uuid; v_var uuid; v_cant int; v_costo numeric; v_nombre text; v_total numeric := 0;
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede registrar compras'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'La compra no tiene productos'; end if;

  insert into public.compras (proveedor_id, fecha, comprobante, notas)
  values (p_proveedor, coalesce(p_fecha, current_date), nullif(trim(p_comprobante), ''), nullif(trim(p_notas), ''))
  returning id, numero into v_id, v_num;

  perform set_config('app.stock_motivo', 'compra', true);
  perform set_config('app.stock_ref', v_num, true);

  for it in select * from jsonb_array_elements(p_items) loop
    v_prod := nullif(it->>'producto_id', '')::uuid;
    v_var := nullif(it->>'variante_id', '')::uuid;
    v_cant := (it->>'cantidad')::int;
    v_costo := (it->>'costo')::numeric;
    if v_cant is null or v_cant <= 0 or v_costo is null or v_costo < 0 then raise exception 'Cantidad o costo inválido'; end if;
    if v_var is not null and not exists (select 1 from public.variantes where id = v_var and producto_id = v_prod) then
      raise exception 'La opción elegida no corresponde al producto';
    end if;
    select p.nombre || coalesce(' — ' || v.nombre, '') into v_nombre
      from public.productos p left join public.variantes v on v.id = v_var
     where p.id = v_prod and p.tipo = 'producto';
    if v_nombre is null then raise exception 'Producto inexistente'; end if;

    insert into public.compra_items (compra_id, producto_id, variante_id, nombre, cantidad, costo_unitario)
    values (v_id, v_prod, v_var, v_nombre, v_cant, v_costo);

    if v_var is not null then update public.variantes set stock = stock + v_cant where id = v_var;
    else update public.productos set stock = stock + v_cant where id = v_prod;
    end if;

    insert into public.costos (producto_id, variante_id, costo) values (v_prod, v_var, v_costo)
    on conflict (producto_id, variante_id) do update set costo = excluded.costo, actualizado_en = now();

    v_total := v_total + v_cant * v_costo;
  end loop;

  update public.compras set total = v_total where id = v_id;
  return v_id;
end; $$;
revoke execute on function public.registrar_compra(uuid, date, text, text, jsonb) from public, anon;
grant execute on function public.registrar_compra(uuid, date, text, text, jsonb) to authenticated;

-- Anula una compra cargada por error: descuenta lo que había sumado al stock.
create or replace function public.anular_compra(p_compra uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare c record; it record;
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede anular compras'; end if;
  select id, numero, anulada into c from public.compras where id = p_compra for update;
  if c.id is null or c.anulada then return; end if;
  perform set_config('app.stock_motivo', 'ajuste', true);
  perform set_config('app.stock_ref', c.numero, true);
  perform set_config('app.stock_nota', 'Compra anulada', true);
  for it in select producto_id, variante_id, cantidad from public.compra_items where compra_id = p_compra loop
    if it.variante_id is not null then update public.variantes set stock = stock - it.cantidad where id = it.variante_id;
    elsif it.producto_id is not null then update public.productos set stock = stock - it.cantidad where id = it.producto_id;
    end if;
  end loop;
  update public.compras set anulada = true where id = p_compra;
end; $$;
revoke execute on function public.anular_compra(uuid) from public, anon;
grant execute on function public.anular_compra(uuid) to authenticated;

-- ---------- Cobros de órdenes del taller (admite señas y pagos parciales) ----------
create table public.cobros (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid references public.trabajos(id) on delete set null,
  trabajo_numero text,                -- copia: el cobro queda aunque se borre la orden
  cliente_nombre text,
  fecha date not null default current_date,
  monto numeric(14,2) not null check (monto > 0),
  medio text not null check (medio in ('efectivo', 'transferencia', 'mercadopago', 'tarjeta', 'otro')),
  nota text,
  usuario_id uuid default auth.uid(),
  creado_en timestamptz not null default now()
);
create index cobros_trabajo_idx on public.cobros(trabajo_id);
create index cobros_fecha_idx on public.cobros(fecha desc);
alter table public.cobros enable row level security;
create policy "staff ve cobros" on public.cobros for select to authenticated using ((select public.is_staff()));
create policy "staff registra cobros" on public.cobros for insert to authenticated with check ((select public.is_staff()));
create policy "admin borra cobros" on public.cobros for delete to authenticated using ((select public.is_admin()));

-- ---------- Comprobantes internos (ARCA / Factura C en una segunda etapa) ----------
create sequence public.comprobantes_numero_seq;
create table public.comprobantes (
  id uuid primary key default gen_random_uuid(),
  numero bigint not null unique default nextval('public.comprobantes_numero_seq'),
  tipo text not null default 'interno' check (tipo in ('interno', 'factura_c')),
  pedido_id uuid references public.pedidos(id) on delete set null,
  trabajo_id uuid references public.trabajos(id) on delete set null,
  referencia text,                    -- P-00012 / OT-00045
  fecha date not null default current_date,
  cliente_nombre text not null,
  cliente_doc text,
  cliente_telefono text,
  cliente_email text,
  detalle jsonb not null default '[]',  -- [{ "descripcion": text, "cantidad": int, "precio": numeric }]
  total numeric(14,2) not null,
  medio_pago text,
  anulado boolean not null default false,
  anulado_en timestamptz,
  -- Para ARCA (todavía sin usar)
  punto_venta int,
  arca_numero bigint,
  cae text,
  cae_vto date,
  usuario_id uuid default auth.uid(),
  creado_en timestamptz not null default now()
);
create unique index comprobantes_pedido_uq on public.comprobantes(pedido_id) where pedido_id is not null and not anulado;
create unique index comprobantes_trabajo_uq on public.comprobantes(trabajo_id) where trabajo_id is not null and not anulado;
create index comprobantes_fecha_idx on public.comprobantes(fecha desc);
alter table public.comprobantes enable row level security;
create policy "admin gestiona comprobantes" on public.comprobantes for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
