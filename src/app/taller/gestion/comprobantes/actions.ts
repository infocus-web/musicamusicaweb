"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function anularComprobante(id: string) {
  await (await createClient()).from("comprobantes").update({ anulado: true, anulado_en: new Date().toISOString() }).eq("id", id);
  revalidatePath("/taller/gestion/comprobantes");
  revalidatePath(`/taller/gestion/comprobantes/${id}`);
}
