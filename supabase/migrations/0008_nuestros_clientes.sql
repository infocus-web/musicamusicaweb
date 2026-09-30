-- "Nuestros clientes": trabajos que el taller muestra y opiniones reales de clientes.

-- Opinión que deja el cliente desde su seguimiento cuando el trabajo está listo/entregado.
create table public.resenas (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid unique references public.trabajos(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  puntaje int not null check (puntaje between 1 and 5),
  comentario text,
  nombre_publico text,
  autoriza_publicar boolean not null default false,   -- lo decide el cliente
  aprobada boolean not null default false,            -- lo decide el taller
  creado_en timestamptz not null default now()
);
alter table public.resenas enable row level security;
create policy "staff gestiona resenas" on public.resenas for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "público ve reseñas aprobadas" on public.resenas for select to anon, authenticated using (aprobada and autoriza_publicar);

-- Trabajos que se muestran en la web (fotos/videos copiados a un bucket público).
create table public.casos (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid references public.trabajos(id) on delete set null,
  resena_id uuid references public.resenas(id) on delete set null,
  titulo text not null,
  instrumento text,
  servicio text,
  descripcion text,
  media jsonb not null default '[]',   -- [{ "path": "...", "tipo": "foto" | "video" }]
  publicado boolean not null default false,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);
alter table public.casos enable row level security;
create policy "staff gestiona casos" on public.casos for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "público ve casos publicados" on public.casos for select to anon, authenticated using (publicado);

insert into storage.buckets (id, name, public) values ('casos', 'casos', true) on conflict (id) do nothing;
create policy "staff sube casos" on storage.objects for insert to authenticated with check (bucket_id = 'casos' and (select public.is_staff()));
create policy "staff borra casos" on storage.objects for delete to authenticated using (bucket_id = 'casos' and (select public.is_staff()));
