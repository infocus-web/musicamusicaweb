"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obtenerStaff } from "@/lib/auth";

const refrescar = () => { revalidatePath("/taller/turnos"); revalidatePath("/taller", "layout"); };
const fechaOk = (s: unknown) => (typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
const horaOk = (s: unknown) => (typeof s === "string" && /^\d{1,2}:\d{2}$/.test(s) ? s : null);

/** Confirma (o reprograma) un turno: queda en la agenda, en el chat del cliente y como aviso de WhatsApp. */
export async function confirmarTurno(id: string, fd: FormData) {
  const { user, staff } = await obtenerStaff();
  if (!staff || !user) throw new Error("Sin permiso");
  const fecha = fechaOk(fd.get("fecha")), hora = horaOk(fd.get("hora"));
  if (!fecha || !hora) throw new Error("Elegí día y hora.");
  const supabase = await createClient();
  const { data: t } = await supabase.from("turnos").update({ fecha, hora, estado: "confirmado" }).eq("id", id).select("cliente_id").single();
  if (!t) return;
  const dia = new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  await supabase.from("mensajes").insert({ cliente_id: t.cliente_id, autor: "taller", staff_id: user.id, tipo: "turno", leido_taller: true, texto: `📅 Turno confirmado: ${dia} a las ${hora}. ¡Te esperamos!` });
  await supabase.from("avisos").insert({ cliente_id: t.cliente_id, tipo: "turno", dato: `${fecha} ${hora}` });
  refrescar();
}

export async function estadoTurno(id: string, estado: "realizado" | "cancelado") {
  await (await createClient()).from("turnos").update({ estado }).eq("id", id);
  refrescar();
}

/** El taller agenda un turno a mano (por ejemplo, alguien que llamó o escribió por WhatsApp). */
export async function nuevoTurno(fd: FormData) {
  const fecha = fechaOk(fd.get("fecha")), hora = horaOk(fd.get("hora"));
  const cliente = String(fd.get("cliente") ?? "");
  if (!cliente || !fecha || !hora) throw new Error("Elegí cliente, día y hora.");
  await (await createClient()).from("turnos").insert({
    cliente_id: cliente, fecha, hora, estado: "confirmado", origen: "taller",
    modo: String(fd.get("modo") ?? "") || null, motivo: String(fd.get("motivo") ?? "").trim().slice(0, 500) || null,
  });
  refrescar();
}
