"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const t = (fd: FormData, k: string, max = 300) => { const s = String(fd.get(k) ?? "").trim().slice(0, max); return s || null; };

export async function guardarProveedor(id: string | null, fd: FormData) {
  const nombre = t(fd, "nombre", 160);
  if (!nombre) throw new Error("Falta el nombre.");
  const fila = { nombre, cuit: t(fd, "cuit", 20), telefono: t(fd, "telefono", 40), email: t(fd, "email", 160), notas: t(fd, "notas", 1000) };
  const supabase = await createClient();
  const { error } = id ? await supabase.from("proveedores").update(fila).eq("id", id) : await supabase.from("proveedores").insert(fila);
  if (error) throw new Error(error.message);
  revalidatePath("/taller/gestion/proveedores");
}

export async function alternarProveedor(id: string, activo: boolean) {
  await (await createClient()).from("proveedores").update({ activo }).eq("id", id);
  revalidatePath("/taller/gestion/proveedores");
}
