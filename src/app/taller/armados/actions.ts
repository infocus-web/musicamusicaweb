"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obtenerStaff } from "@/lib/auth";
import { formatoPesos } from "@/lib/estados";

const num = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

/**
 * Guarda los valores del armado (por parte y total). Con `enviar=1` se lo pasa al cliente:
 * queda "presupuestado", lo ve en su panel y le llega un mensaje al chat.
 */
export async function guardarPresupuestoArmado(id: string, fd: FormData) {
  const { user, staff } = await obtenerStaff();
  if (!staff || !user) throw new Error("Sin permiso.");
  const supabase = await createClient();
  const { data: a } = await supabase.from("armados").select("id, cliente_id, nombre, estado").eq("id", id).maybeSingle();
  if (!a || !["enviado", "presupuestado"].includes(a.estado)) return;

  const { data: partes } = await supabase.from("armado_partes").select("id").eq("armado_id", a.id);
  for (const p of partes ?? []) {
    if (!fd.has(`precio_${p.id}`)) continue;
    await supabase.from("armado_partes").update({ precio: num(fd.get(`precio_${p.id}`)) }).eq("id", p.id);
  }

  const total = num(fd.get("presupuesto"));
  const detalle = String(fd.get("detalle") ?? "").trim().slice(0, 4000) || null;
  const enviar = fd.get("enviar") === "1" && total != null;
  const ahora = new Date().toISOString();
  await supabase.from("armados").update({
    presupuesto: total, detalle_presupuesto: detalle,
    ...(enviar ? { estado: "presupuestado", presupuestado_en: ahora, actualizado_en: ahora } : {}),
  }).eq("id", a.id);

  if (enviar) {
    await supabase.from("mensajes").insert({
      cliente_id: a.cliente_id, autor: "taller", staff_id: user.id, tipo: "sistema", leido_taller: true,
      texto: `🛠️ Ya tenés el presupuesto de tu armado "${a.nombre}": ${formatoPesos(total)}.\nLo podés ver y aprobar en "Armá tu instrumento".`,
    });
  }
  revalidatePath("/taller/armados");
  revalidatePath(`/taller/armados/${a.id}`);
}
