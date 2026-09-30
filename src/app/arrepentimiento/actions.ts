"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoArr = undefined | { error: string } | { codigo: string };

export async function pedirArrepentimiento(_p: EstadoArr, fd: FormData): Promise<EstadoArr> {
  const s = (k: string, max = 300) => { const v = String(fd.get(k) ?? "").trim().slice(0, max); return v || null; };
  if (s("sitio_web")) return { error: "No se pudo enviar." };
  const nombre = s("nombre", 120);
  const email = s("email", 160);
  const telefono = s("telefono", 40);
  if (!nombre) return { error: "Escribí tu nombre." };
  if (!email && !telefono) return { error: "Dejanos un email o un teléfono para contactarte." };
  const { data, error } = await createAdminClient().from("arrepentimientos")
    .insert({ nombre, email, telefono, referencia: s("referencia", 200), detalle: s("detalle", 2000) })
    .select("codigo").single();
  if (error || !data) return { error: "No pudimos registrar el pedido. Probá de nuevo o escribinos." };
  return { codigo: data.codigo };
}
