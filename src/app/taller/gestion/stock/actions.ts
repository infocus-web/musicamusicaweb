"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Ajuste manual: deja el stock en el número contado, con motivo (queda en los movimientos). */
export async function ajustarStock(producto: string, variante: string | null, fd: FormData) {
  const nuevo = Math.round(Number(String(fd.get("nuevo") ?? "").replace(",", ".")));
  if (!Number.isFinite(nuevo) || nuevo < 0) throw new Error("Cantidad inválida.");
  const nota = String(fd.get("nota") ?? "").trim().slice(0, 300) || "Ajuste manual";
  const { error } = await (await createClient()).rpc("ajustar_stock", { p_producto: producto, p_variante: variante, p_nuevo: nuevo, p_nota: nota });
  if (error) throw new Error(error.message);
  revalidatePath("/taller/gestion/stock");
}

/** Guarda el costo de un producto o variante. */
export async function guardarCosto(producto: string, variante: string | null, fd: FormData) {
  const costo = Number(String(fd.get("costo") ?? "").replace(/\./g, "").replace(",", "."));
  const supabase = await createClient();
  let q = supabase.from("costos").delete().eq("producto_id", producto);
  q = variante ? q.eq("variante_id", variante) : q.is("variante_id", null);
  await q;
  if (Number.isFinite(costo) && costo >= 0 && String(fd.get("costo") ?? "").trim() !== "")
    await supabase.from("costos").insert({ producto_id: producto, variante_id: variante, costo });
  revalidatePath("/taller/gestion/stock");
}
