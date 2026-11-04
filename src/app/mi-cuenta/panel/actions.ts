"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolverCliente } from "@/lib/acceso-cliente";
import { emailCliente } from "@/lib/auth";
import { enviarEmail, emailTaller } from "@/lib/notificar";
import { formatoPesos, siteUrl } from "@/lib/estados";

export type Mensaje = { id: string; autor: "cliente" | "taller"; tipo: string; texto: string; creado_en: string; trabajo: string | null };

/** Avisa al taller por email solo con el primer mensaje sin leer (no le llena la casilla). */
async function avisarTaller(clienteId: string, nombre: string, codigo: string, texto: string) {
  const db = createAdminClient();
  const { count } = await db.from("mensajes").select("id", { count: "exact", head: true })
    .eq("cliente_id", clienteId).eq("autor", "cliente").eq("leido_taller", false);
  if ((count ?? 0) > 1) return;
  await enviarEmail({
    para: emailTaller(),
    asunto: `Mensaje nuevo de ${nombre} (${codigo})`,
    texto: `${nombre} te escribió desde su panel:\n\n${texto}\n\nResponder: ${siteUrl()}/taller/mensajes/${clienteId}`,
  });
}

async function guardarMensaje(clienteId: string, texto: string, tipo: string, trabajoId: string | null = null) {
  const db = createAdminClient();
  const { error } = await db.from("mensajes").insert({ cliente_id: clienteId, autor: "cliente", tipo, texto: texto.slice(0, 4000), trabajo_id: trabajoId, leido_cliente: true });
  return !error;
}

/** Mensajes del chat (los del taller quedan como leídos por el cliente). */
export async function leerMensajes(token: string | null): Promise<Mensaje[] | null> {
  const c = await resolverCliente(token);
  if (!c) return null;
  const db = createAdminClient();
  const { data } = await db.from("mensajes").select("id, autor, tipo, texto, creado_en, trabajos(numero)")
    .eq("cliente_id", c.id).order("creado_en", { ascending: true }).limit(300);
  await db.from("mensajes").update({ leido_cliente: true }).eq("cliente_id", c.id).eq("autor", "taller").eq("leido_cliente", false);
  return (data ?? []).map((m) => ({
    id: m.id, autor: m.autor, tipo: m.tipo, texto: m.texto, creado_en: m.creado_en,
    trabajo: (m.trabajos as unknown as { numero: string } | null)?.numero ?? null,
  }));
}

export async function enviarMensaje(token: string | null, texto: string, trabajoId: string | null): Promise<{ ok: boolean; error?: string }> {
  const c = await resolverCliente(token);
  if (!c) return { ok: false, error: "Tu sesión venció. Recargá la página." };
  const limpio = String(texto ?? "").trim();
  if (!limpio) return { ok: false, error: "Escribí un mensaje." };
  // La orden mencionada tiene que ser de este cliente.
  let tid: string | null = null;
  if (trabajoId) {
    const { data } = await createAdminClient().from("trabajos").select("id").eq("id", trabajoId).eq("cliente_id", c.id).maybeSingle();
    tid = data?.id ?? null;
  }
  if (!(await guardarMensaje(c.id, limpio, "texto", tid))) return { ok: false, error: "No se pudo enviar. Probá de nuevo." };
  await avisarTaller(c.id, c.nombre, c.codigo, limpio);
  return { ok: true };
}

/** Pedido de turno: queda en el chat como un mensaje especial. */
export async function pedirTurno(token: string | null, _p: { ok?: boolean; error?: string } | undefined, fd: FormData) {
  const c = await resolverCliente(token);
  if (!c) return { error: "Tu sesión venció. Recargá la página." };
  const fecha = String(fd.get("fecha") ?? "");
  const franja = String(fd.get("franja") ?? "");
  const motivo = String(fd.get("motivo") ?? "").trim().slice(0, 1000);
  const modo = String(fd.get("modo") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "Elegí un día." };
  const dia = new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const texto = `📅 Pedido de turno\nDía: ${dia}${franja ? ` · ${franja}` : ""}\n${modo ? `Cómo: ${modo}\n` : ""}${motivo ? `Motivo: ${motivo}` : ""}`.trim();
  if (!(await guardarMensaje(c.id, texto, "turno"))) return { error: "No se pudo enviar. Probá de nuevo." };
  await avisarTaller(c.id, c.nombre, c.codigo, texto);
  return { ok: true };
}

/** El cliente aprueba o rechaza un presupuesto o una ampliación. */
export async function responderAprobacion(token: string | null, aprobacionId: string, aprobar: boolean, comentario: string) {
  const c = await resolverCliente(token);
  if (!c) return { error: "Tu sesión venció. Recargá la página." };
  const db = createAdminClient();
  const { data: a } = await db.from("aprobaciones")
    .select("id, tipo, monto, estado, trabajo_id, trabajos!inner(id, numero, cliente_id, estado, presupuesto)")
    .eq("id", aprobacionId).maybeSingle();
  const t = a?.trabajos as unknown as { id: string; numero: string; cliente_id: string; estado: string; presupuesto: number | null } | undefined;
  if (!a || !t || t.cliente_id !== c.id) return { error: "No encontramos ese pedido." };
  if (a.estado !== "pendiente") return { error: "Ese pedido ya fue respondido." };

  const nota = String(comentario ?? "").trim().slice(0, 1000) || null;
  await db.from("aprobaciones").update({ estado: aprobar ? "aprobada" : "rechazada", respuesta: nota, respondida_en: new Date().toISOString() }).eq("id", a.id);

  if (aprobar) {
    const cambios: Record<string, unknown> = { presupuesto_aprobado: true };
    if (a.tipo === "ampliacion") cambios.presupuesto = Number(t.presupuesto ?? 0) + Number(a.monto);
    else cambios.presupuesto = Number(a.monto);
    if (t.estado === "esperando_aprobacion") cambios.estado = "en_trabajo";
    await db.from("trabajos").update(cambios).eq("id", t.id);
    if (cambios.estado) await db.from("avances").insert({ trabajo_id: t.id, estado: "en_trabajo", descripcion: "Aprobaste el presupuesto. ¡Seguimos con el trabajo!" });
  }
  const que = a.tipo === "ampliacion" ? "la ampliación del presupuesto" : "el presupuesto";
  const texto = `${aprobar ? "✅ Apruebo" : "❌ No apruebo"} ${que} de la orden ${t.numero} (${formatoPesos(Number(a.monto))}).${nota ? `\n${nota}` : ""}`;
  await guardarMensaje(c.id, texto, "aprobacion", t.id);
  await avisarTaller(c.id, c.nombre, c.codigo, texto);
  revalidatePath("/mi-cuenta");
  return { ok: true };
}

/** El cliente elige (o cambia) su clave para entrar con su teléfono o email desde cualquier lado. */
export async function ponerClave(token: string | null, _p: { ok?: boolean; error?: string } | undefined, fd: FormData) {
  const c = await resolverCliente(token);
  if (!c) return { error: "Tu sesión venció. Recargá la página." };
  const clave = String(fd.get("clave") ?? "");
  if (clave.length < 6) return { error: "La clave tiene que tener al menos 6 caracteres." };
  if (clave !== String(fd.get("clave2") ?? "")) return { error: "Las dos claves no coinciden." };
  const db = createAdminClient();
  if (c.user_id) {
    const { error } = await db.auth.admin.updateUserById(c.user_id, { password: clave, ban_duration: "none" });
    if (error) return { error: "No se pudo guardar la clave." };
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email: emailCliente(c.codigo), password: clave, email_confirm: true,
      user_metadata: { tipo: "cliente", codigo: c.codigo, nombre: c.nombre },
    });
    if (error || !data.user) return { error: "No se pudo guardar la clave." };
    await db.from("clientes").update({ user_id: data.user.id }).eq("id", c.id);
  }
  return { ok: true };
}
