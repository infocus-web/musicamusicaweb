"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function estadoTasacion(id: string, estado: string) {
  if (!["nueva", "contactado", "cerrada"].includes(estado)) return;
  const supabase = await createClient();
  await supabase.from("tasaciones").update({ estado }).eq("id", id);
  revalidatePath("/taller/consultas");
}

export async function notaTasacion(id: string, fd: FormData) {
  const supabase = await createClient();
  await supabase.from("tasaciones").update({ notas_internas: String(fd.get("nota") ?? "").slice(0, 2000) || null }).eq("id", id);
  revalidatePath("/taller/consultas");
}

export async function estadoArrepentimiento(id: string, estado: string) {
  if (!["recibido", "en_proceso", "resuelto"].includes(estado)) return;
  const supabase = await createClient();
  await supabase.from("arrepentimientos").update({ estado }).eq("id", id);
  revalidatePath("/taller/consultas");
}
