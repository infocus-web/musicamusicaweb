import "server-only";
import { createClient } from "@/lib/supabase/server";
import { finDia, inicioDia, medioLabel } from "@/lib/gestion";
import { PAGOS } from "@/lib/tienda";

export type Venta = { fecha: string; origen: "Tienda" | "Taller"; referencia: string; cliente: string; medio: string; monto: number; link: string };

/** Pedidos pagados de la tienda + cobros del taller, entre dos fechas (YYYY-MM-DD). */
export async function listarVentas(desde: string, hasta: string, origen?: string): Promise<Venta[]> {
  const supabase = await createClient();
  const [{ data: pedidos }, { data: cobros }] = await Promise.all([
    origen === "taller" ? Promise.resolve({ data: [] as never[] }) :
      supabase.from("pedidos").select("id, numero, nombre, total, pago_metodo, pagado_en").eq("pago_estado", "aprobado")
        .gte("pagado_en", inicioDia(desde)).lte("pagado_en", finDia(hasta)),
    origen === "tienda" ? Promise.resolve({ data: [] as never[] }) :
      supabase.from("cobros").select("id, fecha, monto, medio, trabajo_id, trabajo_numero, cliente_nombre, nota").gte("fecha", desde).lte("fecha", hasta),
  ]);
  const v: Venta[] = [
    ...(pedidos ?? []).map((p) => ({ fecha: String(p.pagado_en).slice(0, 10), origen: "Tienda" as const, referencia: p.numero, cliente: p.nombre, medio: PAGOS[p.pago_metodo] ?? p.pago_metodo, monto: Number(p.total), link: `/taller/pedidos/${p.id}` })),
    ...(cobros ?? []).map((c) => ({ fecha: c.fecha, origen: "Taller" as const, referencia: `${c.trabajo_numero ?? ""}${c.nota ? ` · ${c.nota}` : ""}`, cliente: c.cliente_nombre ?? "", medio: medioLabel(c.medio), monto: Number(c.monto), link: c.trabajo_id ? `/taller/trabajos/${c.trabajo_id}` : "#" })),
  ];
  return v.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
