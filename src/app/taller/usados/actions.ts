"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIAS_USADOS, CONDICIONES, SECCIONES } from "@/lib/usados";

const txt = (fd: FormData, k: string, max = 5000) => {
  const s = String(fd.get(k) ?? "").trim().slice(0, max);
  return s === "" ? null : s;
};
const num = (fd: FormData, k: string) => {
  const s = txt(fd, k);
  if (s == null) return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

function refrescar(id?: string, codigo?: string) {
  revalidatePath("/taller/usados");
  if (id) revalidatePath(`/taller/usados/${id}`);
  revalidatePath("/usados");
  if (codigo) revalidatePath(`/usados/${codigo}`);
  revalidatePath("/");
}

export async function crearUsado(fd: FormData) {
  const supabase = await createClient();
  const seccion = SECCIONES.some((s) => s.id === fd.get("seccion")) ? String(fd.get("seccion")) : "usados";
  const { data, error } = await supabase
    .from("usados")
    .insert({ titulo: txt(fd, "titulo", 160) ?? "Nuevo usado", categoria: "guitarras", seccion, garantia_dias: 30 })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo crear");
  redirect(`/taller/usados/${data.id}`);
}

export async function guardarUsado(id: string, fd: FormData) {
  const supabase = await createClient();
  const { data: previo } = await supabase.from("usados").select("estado, codigo").eq("id", id).single();
  const estado = ["borrador", "publicado", "reservado", "vendido"].includes(String(fd.get("estado"))) ? String(fd.get("estado")) : "borrador";
  const anio = num(fd, "anio");
  const cambios: Record<string, unknown> = {
    titulo: txt(fd, "titulo", 160) ?? "Sin título",
    seccion: SECCIONES.some((s) => s.id === fd.get("seccion")) ? fd.get("seccion") : "usados",
    categoria: CATEGORIAS_USADOS.some((c) => c.id === fd.get("categoria")) ? fd.get("categoria") : "otros",
    condicion: CONDICIONES.some((c) => c.id === fd.get("condicion")) ? fd.get("condicion") : "muy_bueno",
    marca: txt(fd, "marca", 80), modelo: txt(fd, "modelo", 80),
    anio: anio && anio > 1900 && anio < 2100 ? Math.round(anio) : null,
    precio: num(fd, "precio"), precio_anterior: num(fd, "precio_anterior"),
    moneda: fd.get("moneda") === "USD" ? "USD" : "ARS",
    precio_negociable: fd.get("precio_negociable") === "on",
    descripcion: txt(fd, "descripcion"), caracteristicas: txt(fd, "caracteristicas"),
    incluye: txt(fd, "incluye"), revision: txt(fd, "revision"),
    garantia_dias: num(fd, "garantia_dias"),
    acepta_permuta: fd.get("acepta_permuta") === "on",
    envio: fd.get("envio") === "on",
    destacado: fd.get("destacado") === "on",
    estado,
  };
  if (estado === "publicado" && previo?.estado !== "publicado") cambios.publicado_en = new Date().toISOString();
  if (estado === "vendido" && previo?.estado !== "vendido") cambios.vendido_en = new Date().toISOString();
  const { error } = await supabase.from("usados").update(cambios).eq("id", id);
  if (error) throw new Error(error.message);
  refrescar(id, previo?.codigo);
}

export async function cambiarEstadoUsado(id: string, estado: string) {
  if (!["borrador", "publicado", "reservado", "vendido"].includes(estado)) return;
  const supabase = await createClient();
  const cambios: Record<string, unknown> = { estado };
  if (estado === "publicado") cambios.publicado_en = new Date().toISOString();
  if (estado === "vendido") cambios.vendido_en = new Date().toISOString();
  const { data } = await supabase.from("usados").update(cambios).eq("id", id).select("codigo").single();
  refrescar(id, data?.codigo);
}

/** Guarda el orden de las fotos (la primera es la portada) y borra del bucket las que se quitaron. */
export async function guardarFotos(id: string, fotos: string[]) {
  const supabase = await createClient();
  const { data: previo } = await supabase.from("usados").select("fotos, codigo").eq("id", id).single();
  const limpias = fotos.filter((f) => typeof f === "string" && f.startsWith(`${id}/`)).slice(0, 20);
  const { error } = await supabase.from("usados").update({ fotos: limpias }).eq("id", id);
  if (error) throw new Error(error.message);
  const quitadas = (previo?.fotos ?? []).filter((f: string) => !limpias.includes(f));
  if (quitadas.length) await supabase.storage.from("usados").remove(quitadas);
  refrescar(id, previo?.codigo);
}

export async function borrarUsado(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("usados").select("fotos").eq("id", id).single();
  if (data?.fotos?.length) await supabase.storage.from("usados").remove(data.fotos);
  const { error } = await supabase.from("usados").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refrescar();
  redirect("/taller/usados");
}
