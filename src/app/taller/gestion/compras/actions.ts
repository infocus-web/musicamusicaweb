"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ItemCompra = { producto_id: string; variante_id: string | null; cantidad: number; costo: number };

/** Registra la compra: suma stock y actualiza el costo de cada producto (todo junto o nada). */
export async function registrarCompra(input: { proveedor: string | null; fecha: string; comprobante: string; notas: string; items: ItemCompra[] }) {
  const items = (input.items ?? []).filter((i) => i.producto_id && i.cantidad > 0 && i.costo >= 0);
  if (!items.length) return { error: "Agregá al menos un producto con cantidad y costo." };
  const { error } = await (await createClient()).rpc("registrar_compra", {
    p_proveedor: input.proveedor || null, p_fecha: /^\d{4}-\d{2}-\d{2}$/.test(input.fecha) ? input.fecha : null,
    p_comprobante: input.comprobante ?? "", p_notas: input.notas ?? "", p_items: items,
  });
  if (error) return { error: error.message };
  revalidatePath("/taller/gestion/compras");
  revalidatePath("/taller/gestion/stock");
  return { ok: true };
}

export async function anularCompra(id: string) {
  const { error } = await (await createClient()).rpc("anular_compra", { p_compra: id });
  if (error) throw new Error(error.message);
  revalidatePath("/taller/gestion/compras");
  revalidatePath("/taller/gestion/stock");
}
