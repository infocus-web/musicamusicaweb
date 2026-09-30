import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

export type Ajustes = {
  whatsapp: string | null; direccion: string | null; horarios: string | null; instagram: string | null;
  email: string | null; quienes_somos: string | null; terminos: string | null;
};
export const CLAVES_AJUSTES = ["whatsapp", "email", "direccion", "horarios", "instagram", "quienes_somos", "terminos"] as const;

/** Datos de contacto del taller (se editan en /taller/ajustes). */
export const obtenerAjustes = cache(async (): Promise<Ajustes> => {
  const { data } = await createAdminClient().from("ajustes").select("clave, valor");
  const m = Object.fromEntries((data ?? []).map((r) => [r.clave, r.valor]));
  return Object.fromEntries(CLAVES_AJUSTES.map((k) => [k, m[k] ?? null])) as Ajustes;
});

/** Link de WhatsApp al taller con un mensaje armado (o null si no hay número cargado). */
export function waTaller(numero: string | null, mensaje: string) {
  let n = (numero ?? "").replace(/\D/g, "");
  if (!n) return null;
  if (!n.startsWith("54")) n = "549" + n.replace(/^0/, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}`;
}
