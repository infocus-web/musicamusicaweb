"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Marca como enviados (o descartados) todos los avisos pendientes de un cliente. */
export async function cerrarAvisos(ids: string[], descartar = false) {
  if (!ids.length) return;
  await (await createClient()).from("avisos")
    .update(descartar ? { descartado: true } : { enviado_en: new Date().toISOString() }).in("id", ids);
  revalidatePath("/taller/avisos");
  revalidatePath("/taller", "layout");
}
