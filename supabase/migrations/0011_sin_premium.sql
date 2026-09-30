-- Se quita la sección "Usados Premium": lo que hubiera pasa a "Usados".
update public.usados set seccion = 'usados' where seccion = 'premium';
alter table public.usados drop constraint if exists usados_seccion_check;
alter table public.usados add constraint usados_seccion_check check (seccion in ('usados', 'liquidacion'));
