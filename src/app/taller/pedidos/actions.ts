"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obtenerStaff } from "@/lib/auth";
import { cancelarPedido } from "@/lib/pedidos";
import { ESTADOS_PEDIDO, PAGOS } from "@/lib/tienda";

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

/** Comprobante interno de un pedido de la tienda (con sus ítems y el envío). */
export async function comprobanteDePedido(id: string) {
  const { exigirAdmin } = await import("@/lib/auth");
  const { redirect } = await import("next/navigation");
  await exigirAdmin();
  const supabase = await createClient();
  const { data: existe } = await supabase.from("comprobantes").select("id").eq("pedido_id", id).eq("anulado", false).maybeSingle();
  if (existe) redirect(`/taller/gestion/comprobantes/${existe.id}`);
  const { data: p } = await supabase.from("pedidos").select("*").eq("id", id).single();
  if (!p) throw new Error("Pedido no encontrado.");
  const { data: items } = await supabase.from("pedido_items").select("nombre, cantidad, precio").eq("pedido_id", id);
  const detalle = (items ?? []).map((i) => ({ descripcion: i.nombre, cantidad: i.cantidad, precio: Number(i.precio) }));
  if (Number(p.envio_costo) > 0) detalle.push({ descripcion: `Envío: ${p.envio_nombre ?? ""}`, cantidad: 1, precio: Number(p.envio_costo) });
  if (Number(p.descuento) > 0) detalle.push({ descripcion: "Descuento", cantidad: 1, precio: -Number(p.descuento) });
  const { data: nuevo, error } = await supabase.from("comprobantes").insert({
    pedido_id: id, referencia: p.numero, cliente_nombre: p.nombre, cliente_doc: p.dni, cliente_telefono: p.telefono, cliente_email: p.email,
    detalle, total: p.total, medio_pago: PAGOS[p.pago_metodo] ?? p.pago_metodo,
  }).select("id").single();
  if (error || !nuevo) throw new Error(error?.message ?? "No se pudo crear.");
  redirect(`/taller/gestion/comprobantes/${nuevo.id}`);
}
