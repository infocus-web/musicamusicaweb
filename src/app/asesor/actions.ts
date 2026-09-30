"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Usado } from "@/lib/usados";

const RANGOS: Record<string, [number, number]> = {
  hasta150: [0, 150000],
  "150a400": [150000, 400000],
  "400a1m": [400000, 1000000],
  mas1m: [1000000, 1e12],
};

/** Guarda las respuestas (para estadísticas) y devuelve usados que encajan. */
export async function resultadoAsesor(objetivo: string, respuestas: Record<string, string>) {
  const db = createAdminClient();
  const limpio = Object.fromEntries(Object.entries(respuestas ?? {}).slice(0, 10).map(([k, v]) => [String(k).slice(0, 40), String(v).slice(0, 120)]));
  await db.from("asesor_consultas").insert({ objetivo: String(objetivo).slice(0, 40), respuestas: limpio });

  if (objetivo !== "comprar" || respuestas.preferencia === "nuevo") return { usados: [] as Usado[] };
  let q = db.from("usados").select("*").eq("estado", "publicado");
  if (respuestas.categoria) q = q.eq("categoria", respuestas.categoria);
  const r = RANGOS[respuestas.presupuestoId ?? ""];
  if (r) q = q.eq("moneda", "ARS").gte("precio", r[0] * 0.8).lte("precio", r[1] * 1.15);
  const { data } = await q.order("destacado", { ascending: false }).order("publicado_en", { ascending: false }).limit(3);
  return { usados: (data ?? []) as Usado[] };
}
