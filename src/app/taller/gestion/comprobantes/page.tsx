import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatoFecha, formatoPesos } from "@/lib/estados";
import { numeroComprobante } from "@/lib/gestion";

export default async function ComprobantesPage() {
  const { data } = await (await createClient()).from("comprobantes").select("id, numero, fecha, referencia, cliente_nombre, total, anulado, tipo").order("numero", { ascending: false }).limit(300);
  return (
    <div className="space-y-4">
      <p className="muted text-sm">Comprobantes internos (no válidos como factura). Se generan desde cada <b>orden de trabajo</b> (sección Cobros) o desde un <b>pedido pagado</b> de la tienda. La factura electrónica de ARCA queda para la segunda etapa.</p>
      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead className="muted text-left"><tr><th className="p-3">N°</th><th className="p-3">Fecha</th><th className="p-3">Cliente</th><th className="p-3">Referencia</th><th className="p-3 text-right">Total</th></tr></thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                <td className="p-3"><Link href={`/taller/gestion/comprobantes/${c.id}`} className="link font-mono">{numeroComprobante(c.numero)}</Link>{c.anulado && <span className="badge ml-2 bg-red-100 text-red-700">Anulado</span>}</td>
                <td className="p-3">{formatoFecha(c.fecha)}</td>
                <td className="p-3">{c.cliente_nombre}</td>
                <td className="p-3 font-mono">{c.referencia}</td>
                <td className={`p-3 text-right font-semibold ${c.anulado ? "line-through muted" : ""}`}>{formatoPesos(Number(c.total))}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && <tr><td colSpan={5} className="muted p-3">Todavía no hay comprobantes.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
