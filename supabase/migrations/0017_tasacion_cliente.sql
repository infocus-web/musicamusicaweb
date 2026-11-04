-- "Vendé tu usado": solo clientes registrados, y el taller aprueba a mano antes de publicar.
-- cliente_id: quién la mandó (sesión de cliente). usado_id: la publicación creada al aprobarla.
alter table public.tasaciones add column if not exists cliente_id uuid references public.clientes(id) on delete set null;
alter table public.tasaciones add column if not exists usado_id uuid references public.usados(id) on delete set null;
create index if not exists tasaciones_cliente_idx on public.tasaciones(cliente_id);
create index if not exists tasaciones_usado_idx on public.tasaciones(usado_id);
