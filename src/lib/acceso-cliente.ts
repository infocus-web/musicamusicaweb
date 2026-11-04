import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ClientePanel = { id: string; codigo: string; nombre: string; telefono: string | null; email: string | null; token: string; user_id: string | null };

/**
 * Identifica al cliente del panel: con el token de su link privado (el que le mandamos por WhatsApp)
 * o, si no hay token, con su sesión de Mi cuenta (teléfono/email + clave).
 */
export async function resolverCliente(token?: string | null): Promise<ClientePanel | null> {
  const db = createAdminClient();
  const campos = "id, codigo, nombre, telefono, email, token, user_id";
  if (token) {
    if (!/^[a-f0-9]{32}$/.test(token)) return null;
    const { data } = await db.from("clientes").select(campos).eq("token", token).maybeSingle();
    return (data as ClientePanel | null) ?? null;
  }
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return null;
  const { data } = await db.from("clientes").select(campos).eq("user_id", user.id).maybeSingle();
  return (data as ClientePanel | null) ?? null;
}
