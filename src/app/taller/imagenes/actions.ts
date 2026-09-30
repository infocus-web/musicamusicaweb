"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerStaff } from "@/lib/auth";
import { SLOTS } from "@/lib/imagenes-sitio";

/** Guarda (o quita) la foto de un lugar de la web y borra la anterior del bucket. */
export async function guardarImagenSitio(slotId: string, path: string | null) {
  const { staff } = await obtenerStaff();
  if (!staff) throw new Error("Sin permiso");
  const slot = SLOTS.find((s) => s.id === slotId);
  if (!slot) throw new Error("Lugar desconocido");
  if (path && !path.startsWith(`${slotId}/`)) throw new Error("Ruta inválida");
  const db = createAdminClient();
  const { data: previo } = await db.from("ajustes").select("valor").eq("clave", slot.clave).maybeSingle();
  const { error } = await db.from("ajustes").upsert({ clave: slot.clave, valor: path, actualizado_en: new Date().toISOString() });
  if (error) throw new Error(error.message);
  if (previo?.valor && previo.valor !== path) await db.storage.from("sitio").remove([previo.valor]);
  revalidatePath("/", "layout");
}

export async function guardarTextosBanner(fd: FormData) {
  const { staff } = await obtenerStaff();
  if (!staff) throw new Error("Sin permiso");
  const filas = ["hero_titulo", "hero_texto", "hero_boton", "hero_link"].map((clave) => {
    const v = String(fd.get(clave) ?? "").trim().slice(0, 300);
    return { clave, valor: v || null, actualizado_en: new Date().toISOString() };
  });
  await createAdminClient().from("ajustes").upsert(filas);
  revalidatePath("/", "layout");
}
