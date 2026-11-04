"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const t = (fd: FormData, k: string, max = 4000) => { const s = String(fd.get(k) ?? "").trim().slice(0, max); return s || null; };

export async function crearNovedad(fd: FormData) {
  const titulo = t(fd, "titulo", 160);
  if (!titulo) return;
  const link = t(fd, "link", 500);
  await (await createClient()).from("novedades").insert({ titulo, texto: t(fd, "texto"), link: link && /^(https?:\/\/|\/)/.test(link) ? link : null });
  revalidatePath("/taller/novedades");
}

export async function alternarNovedad(id: string, publicada: boolean) {
  await (await createClient()).from("novedades").update({ publicada }).eq("id", id);
  revalidatePath("/taller/novedades");
}

export async function borrarNovedad(id: string) {
  await (await createClient()).from("novedades").delete().eq("id", id);
  revalidatePath("/taller/novedades");
}
