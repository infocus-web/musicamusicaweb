"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIAS_TIENDA, slugify } from "@/lib/tienda";
import { limpiarVideos } from "@/lib/video";

const txt = (fd: FormData, k: string, max = 5000) => { const s = String(fd.get(k) ?? "").trim().slice(0, max); return s === "" ? null : s; };
const num = (v: FormDataEntryValue | null | string) => {
  const s = String(v ?? "").trim(); if (!s) return null;
  const n = Number(s.replace(/\./g, "").replace(",", ".")); return Number.isFinite(n) ? n : null;
};

function refrescar(id?: string, slug?: string) {
  revalidatePath("/taller/tienda"); if (id) revalidatePath(`/taller/tienda/${id}`);
  revalidatePath("/tienda"); if (slug) revalidatePath(`/tienda/${slug}`);
}

async function slugLibre(base: string, id?: string) {
  const supabase = await createClient();
  let s = slugify(base);
  for (let i = 2; i < 50; i++) {
    const { data } = await supabase.from("productos").select("id").eq("slug", s).maybeSingle();
    if (!data || data.id === id) return s;
    s = `${slugify(base)}-${i}`;
  }
  return `${slugify(base)}-${Date.now()}`;
}

export async function crearProducto(fd: FormData) {
  const supabase = await createClient();
  const nombre = txt(fd, "nombre", 160) ?? "Nuevo producto";
  const tipo = fd.get("tipo") === "servicio" ? "servicio" : "producto";
  const { data, error } = await supabase.from("productos")
    .insert({ nombre, slug: await slugLibre(nombre), tipo, categoria: tipo === "servicio" ? "servicios" : "accesorios" })
    .select("id").single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo crear");
  redirect(`/taller/tienda/${data.id}`);
}

export async function guardarProducto(id: string, fd: FormData) {
  const supabase = await createClient();
  const nombre = txt(fd, "nombre", 160) ?? "Producto";
  const { data: previo } = await supabase.from("productos").select("slug, nombre").eq("id", id).single();
  const slug = previo && previo.nombre === nombre ? previo.slug : await slugLibre(nombre, id);
  const { error } = await supabase.from("productos").update({
    nombre, slug,
    tipo: fd.get("tipo") === "servicio" ? "servicio" : "producto",
    categoria: CATEGORIAS_TIENDA.some((c) => c.id === fd.get("categoria")) ? fd.get("categoria") : "accesorios",
    marca: txt(fd, "marca", 80), sku: txt(fd, "sku", 60), descripcion: txt(fd, "descripcion"),
    precio: num(fd.get("precio")) ?? 0, precio_anterior: num(fd.get("precio_anterior")),
    stock: Math.round(num(fd.get("stock")) ?? 0),
    sin_stock_vende: fd.get("sin_stock_vende") === "on",
    activo: fd.get("activo") === "on", destacado: fd.get("destacado") === "on",
    videos: limpiarVideos(String(fd.get("videos") ?? "")),
  }).eq("id", id);
  if (error) throw new Error(error.message);

  // Variantes: filas var_nombre[] / var_precio[] / var_stock[] / var_id[]
  const nombres = fd.getAll("var_nombre").map(String), precios = fd.getAll("var_precio"), stocks = fd.getAll("var_stock"), ids = fd.getAll("var_id").map(String);
  const { data: actuales } = await supabase.from("variantes").select("id").eq("producto_id", id);
  const mantener: string[] = [];
  for (let i = 0; i < nombres.length; i++) {
    const n = nombres[i].trim(); if (!n) continue;
    const fila = { producto_id: id, nombre: n.slice(0, 80), precio: num(precios[i]), stock: Math.round(num(stocks[i]) ?? 0), orden: i };
    if (ids[i]) { await supabase.from("variantes").update(fila).eq("id", ids[i]).eq("producto_id", id); mantener.push(ids[i]); }
    else { const { data } = await supabase.from("variantes").insert(fila).select("id").single(); if (data) mantener.push(data.id); }
  }
  const borrar = (actuales ?? []).map((v) => v.id).filter((x) => !mantener.includes(x));
  if (borrar.length) await supabase.from("variantes").delete().in("id", borrar);
  refrescar(id, slug);
}

/** Igual que en usados: nunca pierde fotos por una lista vieja; solo borra lo pedido en `quitar`. */
export async function guardarFotosProducto(id: string, fotos: string[], quitar: string[] = []): Promise<string[]> {
  const supabase = await createClient();
  const { data: previo } = await supabase.from("productos").select("fotos, slug").eq("id", id).single();
  const propia = (f: unknown): f is string => typeof f === "string" && f.startsWith(`${id}/`);
  const fuera = new Set(quitar.filter(propia));
  const pedidas = [...new Set(fotos.filter(propia))].filter((f) => !fuera.has(f));
  const extras = ((previo?.fotos ?? []) as string[]).filter((f) => !pedidas.includes(f) && !fuera.has(f));
  const final = [...pedidas, ...extras].slice(0, 15);
  const { error } = await supabase.from("productos").update({ fotos: final }).eq("id", id);
  if (error) throw new Error(error.message);
  if (fuera.size) await supabase.storage.from("productos").remove([...fuera]);
  refrescar(id, previo?.slug);
  return final;
}

export async function borrarProducto(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("productos").select("fotos").eq("id", id).single();
  if (data?.fotos?.length) await supabase.storage.from("productos").remove(data.fotos);
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) throw new Error("No se puede borrar (tiene pedidos). Desactivalo en su lugar.");
  refrescar();
  redirect("/taller/tienda");
}

export async function guardarEnvios(fd: FormData) {
  const supabase = await createClient();
  const ids = fd.getAll("id").map(String);
  for (const id of ids) {
    await supabase.from("envios").update({
      nombre: txt(fd, `nombre_${id}`, 80) ?? "Envío",
      precio: num(fd.get(`precio_${id}`)) ?? 0,
      gratis_desde: num(fd.get(`gratis_${id}`)),
      detalle: txt(fd, `detalle_${id}`, 200),
      activo: fd.get(`activo_${id}`) === "on",
    }).eq("id", id);
  }
  revalidatePath("/taller/tienda/envios");
  revalidatePath("/checkout");
}
