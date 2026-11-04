"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolverCliente, type ClientePanel } from "@/lib/acceso-cliente";
import { enviarEmail, emailTaller } from "@/lib/notificar";
import { formatoPesos, siteUrl } from "@/lib/estados";

/**
 * "Armá tu instrumento" — acciones del cliente.
 * Todo pasa por acá: se valida la sesión (o el link privado) y que el armado sea de ese cliente.
 */

type R = { ok?: boolean; error?: string; id?: string };
const SESION = "Tu sesión venció. Recargá la página.";
const EDITABLES = ["borrador", "enviado", "presupuestado"];

const txt = (fd: FormData, k: string, max: number) => {
  const s = String(fd.get(k) ?? "").trim().slice(0, max);
  return s || null;
};
/** Solo links web (http/https). Si falta el protocolo se lo agregamos. */
function limpiarLink(v: string | null): string | null | false {
  if (!v) return null;
  const s = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return u.toString().slice(0, 1000);
  } catch {
    return false;
  }
}

/** Trae el armado solo si es del cliente. */
async function armadoDe(c: ClientePanel, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await createAdminClient().from("armados").select("id, nombre, estado, cliente_id")
    .eq("id", id).eq("cliente_id", c.id).maybeSingle();
  return data;
}

/**
 * Si el cliente cambia algo de un armado ya presupuestado, el valor deja de valer:
 * vuelve a borrador y tiene que pedir presupuesto de nuevo.
 */
async function marcarCambio(armado: { id: string; estado: string }) {
  const cambios: Record<string, unknown> = { actualizado_en: new Date().toISOString() };
  if (armado.estado === "presupuestado") Object.assign(cambios, { estado: "borrador", presupuesto: null, presupuestado_en: null, enviado_en: null });
  await createAdminClient().from("armados").update(cambios).eq("id", armado.id);
}

async function avisar(c: ClientePanel, texto: string) {
  const db = createAdminClient();
  await db.from("mensajes").insert({ cliente_id: c.id, autor: "cliente", tipo: "sistema", texto: texto.slice(0, 4000), leido_cliente: true });
  await enviarEmail({
    para: emailTaller(),
    asunto: `Armá tu instrumento: ${c.nombre} (${c.codigo})`,
    texto: `${texto}\n\nVer y presupuestar: ${siteUrl()}/taller/armados`,
  });
}

export async function crearArmado(token: string | null, _p: R | undefined, fd: FormData): Promise<R> {
  const c = await resolverCliente(token);
  if (!c) return { error: SESION };
  const nombre = txt(fd, "nombre", 120);
  if (!nombre) return { error: "Ponele un nombre a tu instrumento." };
  const db = createAdminClient();
  const { count } = await db.from("armados").select("id", { count: "exact", head: true }).eq("cliente_id", c.id).in("estado", EDITABLES);
  if ((count ?? 0) >= 20) return { error: "Tenés muchos armados abiertos. Terminá o borrá alguno antes de crear otro." };
  const { data, error } = await db.from("armados").insert({ cliente_id: c.id, nombre, tipo: txt(fd, "tipo", 80), notas: txt(fd, "notas", 4000) }).select("id").single();
  if (error || !data) return { error: "No se pudo crear. Probá de nuevo." };
  return { ok: true, id: data.id };
}

export async function guardarDatosArmado(token: string | null, id: string, _p: R | undefined, fd: FormData): Promise<R> {
  const c = await resolverCliente(token);
  if (!c) return { error: SESION };
  const a = await armadoDe(c, id);
  if (!a) return { error: "No encontramos ese armado." };
  if (!EDITABLES.includes(a.estado)) return { error: "Este armado ya no se puede cambiar." };
  const nombre = txt(fd, "nombre", 120);
  if (!nombre) return { error: "Ponele un nombre a tu instrumento." };
  const { error } = await createAdminClient().from("armados").update({ nombre, tipo: txt(fd, "tipo", 80), notas: txt(fd, "notas", 4000) }).eq("id", a.id);
  if (error) return { error: "No se pudo guardar." };
  await marcarCambio(a);
  return { ok: true };
}

/** Agrega una parte (sin parteId) o la modifica (con parteId). */
export async function guardarParte(token: string | null, armadoId: string, parteId: string | null, _p: R | undefined, fd: FormData): Promise<R> {
  const c = await resolverCliente(token);
  if (!c) return { error: SESION };
  const a = await armadoDe(c, armadoId);
  if (!a) return { error: "No encontramos ese armado." };
  if (!EDITABLES.includes(a.estado)) return { error: "Este armado ya no se puede cambiar." };
  const parte = txt(fd, "parte", 80);
  const nombre = txt(fd, "nombre", 160);
  if (!parte) return { error: "Indicá qué parte es (ej.: Pastilla del puente)." };
  if (!nombre) return { error: "Escribí la marca o el nombre del producto." };
  const link = limpiarLink(txt(fd, "link", 1000));
  if (link === false) return { error: "El link no parece válido. Copialo entero desde la página del producto." };
  const fila = { parte, nombre, modelo: txt(fd, "modelo", 160), link, notas: txt(fd, "notas", 1000) };
  const db = createAdminClient();
  if (parteId) {
    const { error } = await db.from("armado_partes").update(fila).eq("id", parteId).eq("armado_id", a.id);
    if (error) return { error: "No se pudo guardar." };
  } else {
    const { count } = await db.from("armado_partes").select("id", { count: "exact", head: true }).eq("armado_id", a.id);
    if ((count ?? 0) >= 60) return { error: "Llegaste al máximo de partes para un armado." };
    const { error } = await db.from("armado_partes").insert({ ...fila, armado_id: a.id, orden: count ?? 0 });
    if (error) return { error: "No se pudo agregar." };
  }
  await marcarCambio(a);
  return { ok: true };
}

export async function borrarParte(token: string | null, armadoId: string, parteId: string): Promise<R> {
  const c = await resolverCliente(token);
  if (!c) return { error: SESION };
  const a = await armadoDe(c, armadoId);
  if (!a) return { error: "No encontramos ese armado." };
  if (!EDITABLES.includes(a.estado)) return { error: "Este armado ya no se puede cambiar." };
  await createAdminClient().from("armado_partes").delete().eq("id", parteId).eq("armado_id", a.id);
  await marcarCambio(a);
  return { ok: true };
}

/** Borra un armado que todavía no se mandó a presupuestar (o lo da de baja si ya se mandó). */
export async function borrarArmado(token: string | null, id: string): Promise<R> {
  const c = await resolverCliente(token);
  if (!c) return { error: SESION };
  const a = await armadoDe(c, id);
  if (!a) return { error: "No encontramos ese armado." };
  const db = createAdminClient();
  if (a.estado === "borrador") await db.from("armados").delete().eq("id", a.id);
  else if (a.estado === "enviado" || a.estado === "presupuestado") {
    await db.from("armados").update({ estado: "cancelado", actualizado_en: new Date().toISOString() }).eq("id", a.id);
    await avisar(c, `🛠️ ${c.nombre} canceló su armado "${a.nombre}".`);
  } else return { error: "Este armado ya no se puede borrar." };
  return { ok: true };
}

export async function pedirPresupuestoArmado(token: string | null, id: string): Promise<R> {
  const c = await resolverCliente(token);
  if (!c) return { error: SESION };
  const a = await armadoDe(c, id);
  if (!a) return { error: "No encontramos ese armado." };
  if (a.estado !== "borrador") return { error: "Este armado ya fue enviado." };
  const db = createAdminClient();
  const { data: partes } = await db.from("armado_partes").select("parte, nombre, modelo").eq("armado_id", a.id).order("orden");
  if (!partes?.length) return { error: "Agregá al menos una parte antes de pedir el presupuesto." };
  const ahora = new Date().toISOString();
  await db.from("armados").update({ estado: "enviado", enviado_en: ahora, actualizado_en: ahora }).eq("id", a.id);
  const lista = partes.map((p) => `• ${p.parte}: ${[p.nombre, p.modelo].filter(Boolean).join(" ")}`).join("\n");
  await avisar(c, `🛠️ Pedido de presupuesto — Armá tu instrumento\n"${a.nombre}" (${partes.length} parte${partes.length === 1 ? "" : "s"})\n${lista}`);
  return { ok: true };
}

export async function responderArmado(token: string | null, id: string, aprobar: boolean, comentario: string): Promise<R> {
  const c = await resolverCliente(token);
  if (!c) return { error: SESION };
  const a = await armadoDe(c, id);
  if (!a) return { error: "No encontramos ese armado." };
  if (a.estado !== "presupuestado") return { error: "Ese presupuesto ya fue respondido." };
  const db = createAdminClient();
  const { data: full } = await db.from("armados").select("presupuesto").eq("id", a.id).single();
  const nota = String(comentario ?? "").trim().slice(0, 1000) || null;
  const ahora = new Date().toISOString();
  await db.from("armados").update({ estado: aprobar ? "aprobado" : "rechazado", respuesta: nota, respondido_en: ahora, actualizado_en: ahora }).eq("id", a.id);
  await avisar(c, `${aprobar ? "✅ Apruebo" : "❌ No apruebo"} el presupuesto de mi armado "${a.nombre}" (${formatoPesos(Number(full?.presupuesto ?? 0))}).${nota ? `\n${nota}` : ""}`);
  return { ok: true };
}
