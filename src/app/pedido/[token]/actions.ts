"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearPreferencia, mpActivo } from "@/lib/mercadopago";

/** Genera (o regenera) el link de Mercado Pago de un pedido pendiente. */
export async function pagarConMP(token: string) {
  if (!/^[a-f0-9]{32}$/.test(token) || !mpActivo()) return;
  const db = createAdminClient();
  const { data: p } = await db.from("pedidos").select("id, numero, token, total, email, nombre, estado, pago_estado").eq("token", token).maybeSingle();
  if (!p || p.estado !== "pendiente" || p.pago_estado === "aprobado") return;
  const pref = await crearPreferencia(p);
  await db.from("pedidos").update({ mp_preference_id: pref.id, pago_metodo: "mercadopago" }).eq("id", p.id);
  redirect(pref.url);
}
