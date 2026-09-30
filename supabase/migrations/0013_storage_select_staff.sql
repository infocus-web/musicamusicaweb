-- El taller necesita poder "ver" los archivos de los buckets públicos para poder borrarlos desde el panel
-- (Storage exige permiso de lectura para remove()).
create policy "staff ve archivos de la web" on storage.objects for select to authenticated
  using (bucket_id in ('usados', 'productos', 'casos', 'sitio') and (select public.is_staff()));
