"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { exigirAdmin } from "@/lib/auth";
import { CLAVES_AJUSTES } from "@/lib/ajustes";

export async function guardarAjustes(fd: FormData) {
  await exigirAdmin();
  const filas = CLAVES_AJUSTES.map((clave) => {
    const v = String(fd.get(clave) ?? "").trim().slice(0, 20000);
    return { clave, valor: v === "" ? null : v, actualizado_en: new Date().toISOString() };
  });
  const { error } = await createAdminClient().from("ajustes").upsert(filas);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
