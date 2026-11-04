import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ClienteActual = { id: string; codigo: string; nombre: string; telefono: string | null; email: string | null };

/** Cliente con sesión iniciada (código + clave), o null si no entró o la cuenta no es de cliente. */
export async function clienteActual(): Promise<ClienteActual | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await createAdminClient()
    .from("clientes").select("id, codigo, nombre, telefono, email").eq("user_id", user.id).maybeSingle();
  return (data as ClienteActual | null) ?? null;
}

/** Solo rutas internas (evita que un link nos mande a otra web después de ingresar). */
export function rutaSegura(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return /^\/(?!\/)[\w\-/?=&%.]*$/.test(s) ? s : null;
}
