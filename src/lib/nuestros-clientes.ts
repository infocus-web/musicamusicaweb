import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Caso, Resena } from "@/lib/casos";

/** Casos publicados + opiniones aprobadas (solo las que el cliente autorizó). */
export async function datosNuestrosClientes(limite = 60) {
  const db = createAdminClient();
  const [{ data: casos }, { data: resenas }] = await Promise.all([
    db.from("casos").select("*").eq("publicado", true).order("orden", { ascending: false }).order("creado_en", { ascending: false }).limit(limite),
    db.from("resenas").select("*").eq("aprobada", true).eq("autoriza_publicar", true).order("creado_en", { ascending: false }).limit(200),
  ]);
  const rs = (resenas ?? []) as Resena[];
  const promedio = rs.length ? rs.reduce((a, r) => a + r.puntaje, 0) / rs.length : null;
  return { casos: (casos ?? []) as Caso[], resenas: rs, promedio };
}
