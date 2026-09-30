import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PagoMP } from "@/lib/mercadopago";

/** Aplica un pago de Mercado Pago a su pedido (idempotente). Solo se aprueba si el monto coincide. */
export async function aplicarPagoMP(pago: PagoMP) {
  if (!pago.external_reference) return;
  const db = createAdminClient();
  const { data: p } = await db.from("pedidos").select("id, total, pago_estado, estado").eq("id", pago.external_reference).maybeSingle();
  if (!p) return;
  if (pago.status === "approved" && Math.abs(Number(p.total) - pago.transaction_amount) < 1) {
    if (p.pago_estado !== "aprobado") {
      await db.from("pedidos").update({
        pago_estado: "aprobado", mp_payment_id: pago.id,
        estado: ["pendiente", "a_cotizar"].includes(p.estado) ? "pagado" : p.estado,
      }).eq("id", p.id);
      // Usados vendidos online: pasan a vendido.
      const { data: items } = await db.from("pedido_items").select("usado_id").eq("pedido_id", p.id).not("usado_id", "is", null);
      const ids = (items ?? []).map((i) => i.usado_id);
      if (ids.length) await db.from("usados").update({ estado: "vendido", vendido_en: new Date().toISOString() }).in("id", ids);
    }
  } else if (["rejected", "cancelled"].includes(pago.status) && p.pago_estado === "pendiente") {
    await db.from("pedidos").update({ pago_estado: "rechazado", mp_payment_id: pago.id }).eq("id", p.id);
  } else if (pago.status === "refunded") {
    await db.from("pedidos").update({ pago_estado: "devuelto" }).eq("id", p.id);
  }
}

/** Cancela un pedido: devuelve stock y vuelve a publicar los usados reservados. */
export async function cancelarPedido(pedidoId: string) {
  const db = createAdminClient();
  const { data: p } = await db.from("pedidos").select("estado").eq("id", pedidoId).single();
  if (!p || p.estado === "cancelado") return;
  const { data: items } = await db.from("pedido_items").select("producto_id, variante_id, usado_id, cantidad").eq("pedido_id", pedidoId);
  for (const i of items ?? []) {
    if (i.usado_id) await db.from("usados").update({ estado: "publicado" }).eq("id", i.usado_id).eq("estado", "reservado");
    else await db.rpc("devolver_stock", { p_producto: i.producto_id, p_variante: i.variante_id, p_cantidad: i.cantidad });
  }
  await db.from("pedidos").update({ estado: "cancelado" }).eq("id", pedidoId);
}
