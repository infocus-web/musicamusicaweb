"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obtenerStaff } from "@/lib/auth";
import { cancelarPedido } from "@/lib/pedidos";
import { ESTADOS_PEDIDO } from "@/lib/tienda";

const refrescar = (id: string) => { revalidatePath("/taller/pedidos"); revalidatePath(`/taller/pedidos/${id}`); };

export async function estadoPedido(id: string, estado: string) {
  if (!(estado in ESTADOS_PEDIDO) || estado === "cancelado") return;
  const supabase = await createClient();
  await supabase.from("pedidos").update({ estado }).eq("id", id);
  refrescar(id);
}

/** Para transferencia o efectivo: el taller confirma que cobró. */
export async function marcarPagado(id: string) {
  const supabase = await createClient();
  const { data: p } = await supabase.from("pedidos").select("estado").eq("id", id).single();
  await supabase.from("pedidos").update({ pago_estado: "aprobado", estado: p && ["pendiente", "a_cotizar"].includes(p.estado) ? "pagado" : p?.estado }).eq("id", id);
  const { data: items } = await supabase.from("pedido_items").select("usado_id").eq("pedido_id", id).not("usado_id", "is", null);
  const ids = (items ?? []).map((i) => i.usado_id);
  if (ids.length) await supabase.from("usados").update({ estado: "vendido", vendido_en: new Date().toISOString() }).in("id", ids);
  refrescar(id);
}

/** Carga el costo del correo y deja el pedido listo para pagar. */
export async function cotizarEnvio(id: string, fd: FormData) {
  const costo = Number(String(fd.get("costo") ?? "").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(costo) || costo < 0) return;
  const supabase = await createClient();
  const { data: p } = await supabase.from("pedidos").select("subtotal, descuento, estado").eq("id", id).single();
  if (!p) return;
  await supabase.from("pedidos").update({
    envio_costo: costo, total: Number(p.subtotal) - Number(p.descuento) + costo,
    estado: p.estado === "a_cotizar" ? "pendiente" : p.estado,
  }).eq("id", id);
  refrescar(id);
}

export async function datosInternos(id: string, fd: FormData) {
  const supabase = await createClient();
  await supabase.from("pedidos").update({
    seguimiento_envio: String(fd.get("seguimiento") ?? "").trim() || null,
    notas_internas: String(fd.get("notas_internas") ?? "").trim() || null,
  }).eq("id", id);
  refrescar(id);
}

export async function cancelar(id: string) {
  const { staff } = await obtenerStaff();
  if (!staff) throw new Error("Sin permiso");
  await cancelarPedido(id);
  refrescar(id);
}
