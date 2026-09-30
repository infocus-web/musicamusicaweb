"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerStaff } from "@/lib/auth";
import type { MediaCaso } from "@/lib/casos";
import { limpiarVideos } from "@/lib/video";

function refrescar(id?: string) {
  revalidatePath("/taller/nuestros-clientes");
  if (id) revalidatePath(`/taller/nuestros-clientes/${id}`);
  revalidatePath("/nuestros-clientes");
  revalidatePath("/");
}

/** Arma un caso a partir de una orden: copia sus fotos/videos visibles a un bucket público. */
export async function crearCasoDesdeTrabajo(trabajoId: string) {
  const { staff } = await obtenerStaff();
  if (!staff) throw new Error("Sin permiso");
  const db = createAdminClient();
  const { data: t } = await db.from("trabajos").select("id, servicio, instrumentos(tipo, marca, modelo)").eq("id", trabajoId).single();
  if (!t) throw new Error("Trabajo no encontrado");
  const inst = t.instrumentos as unknown as { tipo: string; marca: string | null; modelo: string | null } | null;
  const nombreInst = inst ? [inst.marca, inst.modelo].filter(Boolean).join(" ") || inst.tipo : "Instrumento";

  const { data: avances } = await db.from("avances").select("media_path, media_tipo").eq("trabajo_id", trabajoId)
    .eq("visible_cliente", true).not("media_path", "is", null).order("creado_en");
  const { data: resena } = await db.from("resenas").select("id, autoriza_publicar").eq("trabajo_id", trabajoId).maybeSingle();

  const { data: caso, error } = await db.from("casos").insert({
    trabajo_id: trabajoId,
    resena_id: resena?.autoriza_publicar ? resena.id : null,
    titulo: `${t.servicio} de ${nombreInst}`,
    instrumento: inst?.tipo ?? null,
    servicio: t.servicio,
  }).select("id").single();
  if (error || !caso) throw new Error(error?.message ?? "No se pudo crear");

  const media: MediaCaso[] = [];
  for (const a of avances ?? []) {
    const ext = a.media_path!.split(".").pop();
    const destino = `${caso.id}/${media.length + 1}.${ext}`;
    const { error: e } = await db.storage.from("avances").copy(a.media_path!, destino, { destinationBucket: "casos" });
    if (!e) media.push({ path: destino, tipo: a.media_tipo === "video" ? "video" : "foto" });
  }
  await db.from("casos").update({ media }).eq("id", caso.id);
  refrescar();
  redirect(`/taller/nuestros-clientes/${caso.id}`);
}

export async function nuevoCaso() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("casos").insert({ titulo: "Nuevo trabajo" }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo crear");
  redirect(`/taller/nuestros-clientes/${data.id}`);
}

export async function guardarCaso(id: string, fd: FormData) {
  const supabase = await createClient();
  const s = (k: string) => String(fd.get(k) ?? "").trim() || null;
  const { error } = await supabase.from("casos").update({
    titulo: s("titulo") ?? "Trabajo", instrumento: s("instrumento"), servicio: s("servicio"), descripcion: s("descripcion"),
    resena_id: s("resena_id"), publicado: fd.get("publicado") === "on", orden: Number(fd.get("orden")) || 0,
    videos: limpiarVideos(String(fd.get("videos") ?? "")),
  }).eq("id", id);
  if (error) throw new Error(error.message);
  refrescar(id);
}

export async function guardarMediaCaso(id: string, media: MediaCaso[]) {
  const supabase = await createClient();
  const { data: previo } = await supabase.from("casos").select("media").eq("id", id).single();
  const limpia = media.filter((m) => m.path.startsWith(`${id}/`) && (m.tipo === "foto" || m.tipo === "video")).slice(0, 30);
  await supabase.from("casos").update({ media: limpia }).eq("id", id);
  const quitadas = ((previo?.media ?? []) as MediaCaso[]).map((m) => m.path).filter((p) => !limpia.some((m) => m.path === p));
  if (quitadas.length) await supabase.storage.from("casos").remove(quitadas);
  refrescar(id);
}

export async function borrarCaso(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("casos").select("media").eq("id", id).single();
  const paths = ((data?.media ?? []) as MediaCaso[]).map((m) => m.path);
  if (paths.length) await supabase.storage.from("casos").remove(paths);
  await supabase.from("casos").delete().eq("id", id);
  refrescar();
  redirect("/taller/nuestros-clientes");
}

export async function aprobarResena(id: string, aprobada: boolean) {
  const supabase = await createClient();
  await supabase.from("resenas").update({ aprobada }).eq("id", id);
  refrescar();
}
