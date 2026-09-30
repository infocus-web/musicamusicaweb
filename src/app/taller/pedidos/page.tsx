import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_PEDIDO, PAGOS, pesos } from "@/lib/tienda";
import { formatoFechaHora } from "@/lib/estados";

const ABIERTOS = ["pendiente", "a_cotizar", "pagado", "preparando", "enviado", "listo_retirar"];

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("pedidos").select("id, numero, nombre, telefono, total, estado, pago_estado, pago_metodo, envio_nombre, creado_en").order("creado_en", { ascending: false }).limit(300);
  q = estado === "todos" ? q : estado ? q.eq("estado", estado) : q.in("estado", ABIERTOS);
  const { data: pedidos } = await q;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="mr-auto text-2xl font-semibold">Pedidos de la tienda</h1>
        <Link href="/taller/tienda" className="btn-ghost">Productos</Link>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/taller/pedidos" className={!estado ? "btn !py-1" : "btn-ghost !py-1"}>Abiertos</Link>
        {Object.entries(ESTADOS_PEDIDO).map(([k, v]) => <Link key={k} href={`/taller/pedidos?estado=${k}`} className={estado === k ? "btn !py-1" : "btn-ghost !py-1"}>{v.label}</Link>)}
        <Link href="/taller/pedidos?estado=todos" className={estado === "todos" ? "btn !py-1" : "btn-ghost !py-1"}>Todos</Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="muted text-left"><tr><th className="p-3">Pedido</th><th className="p-3">Cliente</th><th className="p-3">Total</th><th className="p-3">Pago</th><th className="p-3">Entrega</th><th className="p-3">Estado</th></tr></thead>
          <tbody>
            {(pedidos ?? []).map((p) => {
              const e = ESTADOS_PEDIDO[p.estado];
              return (
                <tr key={p.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                  <td className="p-3"><Link href={`/taller/pedidos/${p.id}`} className="link font-mono">{p.numero}</Link><div className="muted text-xs">{formatoFechaHora(p.creado_en)}</div></td>
                  <td className="p-3">{p.nombre}<div className="muted text-xs">{p.telefono}</div></td>
                  <td className="p-3">{pesos(p.total)}</td>
                  <td className="p-3">{PAGOS[p.pago_metodo]}<div className={`text-xs ${p.pago_estado === "aprobado" ? "text-emerald-600" : "muted"}`}>{p.pago_estado}</div></td>
                  <td className="p-3">{p.envio_nombre}</td>
                  <td className="p-3"><span className={`badge ${e.color}`}>{e.label}</span></td>
                </tr>
              );
            })}
            {(pedidos ?? []).length === 0 && <tr><td colSpan={6} className="muted p-3">No hay pedidos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
