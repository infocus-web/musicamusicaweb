-- Funciones que solo usan los triggers: nadie las tiene que poder llamar desde la API.
revoke execute on function public.pedido_item_costo() from public, anon, authenticated;
revoke execute on function public.registrar_mov_stock() from public, anon, authenticated;
