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

/**
 * Aprobación manual de una tasación: crea la publicación de usado como BORRADOR (oculta),
 * con los datos y las fotos que mandó el cliente. El taller le pone precio y la publica cuando quiere.
 */
export async function aprobarTasacion(id: string) {
  const { obtenerStaff } = await import("@/lib/auth");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { CATEGORIAS_USADOS, CONDICIONES } = await import("@/lib/usados");
  const { redirect } = await import("next/navigation");
  const { staff } = await obtenerStaff();
  if (!staff) throw new Error("Sin permiso");

  const db = createAdminClient();
  const { data: t } = await db.from("tasaciones").select("*").eq("id", id).eq("tipo", "usado").maybeSingle();
  if (!t) return;
  if (t.usado_id) redirect(`/taller/usados/${t.usado_id}`);

  const titulo = [t.marca, t.modelo].filter(Boolean).join(" ").slice(0, 160) || "Usado a revisar";
  const categoria = CATEGORIAS_USADOS.some((c) => c.id === t.categoria) ? t.categoria : "otros";
  const condicion = CONDICIONES.some((c) => c.id === t.condicion) ? t.condicion : "muy_bueno";
  const { data: u, error } = await db.from("usados").insert({
    titulo, categoria, condicion, marca: t.marca, modelo: t.modelo, anio: t.anio,
    descripcion: t.descripcion, estado: "borrador", seccion: "usados", garantia_dias: 90,
    acepta_permuta: true,
  }).select("id").single();
  if (error || !u) throw new Error("No se pudo crear la publicación.");

  // Copia las fotos del bucket privado de tasaciones al público de usados.
  const fotos: string[] = [];
  for (const [i, p] of ((t.fotos ?? []) as string[]).entries()) {
    const { data: archivo } = await db.storage.from("tasaciones").download(p);
    if (!archivo) continue;
    const destino = `${u.id}/tasacion-${i + 1}.jpg`;
    const { error: e } = await db.storage.from("usados").upload(destino, archivo, { contentType: "image/jpeg", cacheControl: "31536000" });
    if (!e) fotos.push(destino);
  }
  if (fotos.length) await db.from("usados").update({ fotos }).eq("id", u.id);
  await db.from("tasaciones").update({ usado_id: u.id, estado: t.estado === "nueva" ? "contactado" : t.estado }).eq("id", id);

  revalidatePath("/taller/consultas");
  revalidatePath("/taller/usados");
  redirect(`/taller/usados/${u.id}`);
}
