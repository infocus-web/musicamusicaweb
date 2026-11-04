"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obtenerStaff } from "@/lib/auth";
import type { MensajeChat } from "@/components/panel-cliente/Chat";

/** Mensajes con un cliente; al leerlos quedan marcados como leídos por el taller. */
export async function leerChatTaller(clienteId: string): Promise<MensajeChat[] | null> {
  const { staff } = await obtenerStaff();
  if (!staff) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("mensajes").select("id, autor, tipo, texto, creado_en, trabajos(numero)")
    .eq("cliente_id", clienteId).order("creado_en", { ascending: true }).limit(500);
  await supabase.from("mensajes").update({ leido_taller: true }).eq("cliente_id", clienteId).eq("leido_taller", false);
  return (data ?? []).map((m) => ({
    id: m.id, autor: m.autor, tipo: m.tipo, texto: m.texto, creado_en: m.creado_en,
    trabajo: (m.trabajos as unknown as { numero: string } | null)?.numero ?? null,
  }));
}

export async function responderTaller(clienteId: string, texto: string, trabajoId: string | null) {
  const { user, staff } = await obtenerStaff();
  if (!staff || !user) return { ok: false, error: "Sin permiso." };
  const limpio = String(texto ?? "").trim().slice(0, 4000);
  if (!limpio) return { ok: false, error: "Escribí un mensaje." };
  const supabase = await createClient();
  const { error } = await supabase.from("mensajes").insert({
    cliente_id: clienteId, trabajo_id: trabajoId, autor: "taller", staff_id: user.id, texto: limpio, leido_taller: true,
  });
  if (error) return { ok: false, error: "No se pudo enviar." };
  revalidatePath("/taller/mensajes");
  return { ok: true };
}
