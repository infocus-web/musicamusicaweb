-- Banner principal editable desde Ajustes (imagen en bucket público "sitio").
insert into storage.buckets (id, name, public) values ('sitio', 'sitio', true) on conflict (id) do nothing;
create policy "staff sube imagenes del sitio" on storage.objects for insert to authenticated with check (bucket_id = 'sitio' and (select public.is_staff()));
create policy "staff borra imagenes del sitio" on storage.objects for delete to authenticated using (bucket_id = 'sitio' and (select public.is_staff()));
insert into public.ajustes (clave, valor) values ('hero_titulo', null), ('hero_texto', null), ('hero_boton', null), ('hero_link', null), ('hero_imagen', null) on conflict do nothing;
