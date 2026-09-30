-- is_staff() solo la necesitan los usuarios logueados (políticas RLS).
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;
