-- Links de videos (YouTube, Instagram, TikTok, Vimeo) que se muestran embebidos.
alter table public.usados add column if not exists videos text[] not null default '{}';
alter table public.productos add column if not exists videos text[] not null default '{}';
alter table public.casos add column if not exists videos text[] not null default '{}';
insert into public.ajustes (clave, valor) values ('videos_portada', null) on conflict do nothing;
