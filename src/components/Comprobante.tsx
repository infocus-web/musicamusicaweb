import { formatoFecha, formatoPesos } from "@/lib/estados";
import { numeroComprobante } from "@/lib/gestion";
import type { Ajustes } from "@/lib/ajustes";

export type DatosComprobante = {
  numero: number; fecha: string; referencia: string | null; cliente_nombre: string; cliente_doc: string | null;
  cliente_telefono: string | null; cliente_email: string | null; detalle: { descripcion: string; cantidad: number; precio: number }[];
  total: number; medio_pago: string | null; anulado: boolean;
};

/** Comprobante interno en formato hoja (se imprime o se guarda como PDF desde el navegador). */
export function Comprobante({ c, a }: { c: DatosComprobante; a: Ajustes }) {
  return (
    <article className="comprobante mx-auto max-w-3xl space-y-6 rounded-xl border bg-white p-8 text-zinc-900 shadow-sm print:border-0 print:p-0 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-300 pb-4">
        <div className="space-y-0.5 text-sm">
          <p className="text-xl font-bold">Música Música Web</p>
          {a.razon_social && <p>{a.razon_social}</p>}
          {a.cuit && <p>CUIT {a.cuit}{a.condicion_fiscal ? ` · ${a.condicion_fiscal}` : ""}</p>}
          {a.direccion && <p>{a.direccion}</p>}
          <p>{[a.whatsapp && `WhatsApp ${a.whatsapp}`, a.email].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-lg font-bold">COMPROBANTE</p>
          <p className="font-mono">N° {numeroComprobante(c.numero)}</p>
          <p>Fecha: {formatoFecha(c.fecha)}</p>
          {c.referencia && <p>Ref.: {c.referencia}</p>}
          {c.anulado && <p className="mt-1 font-bold text-red-700">ANULADO</p>}
        </div>
      </header>
      <section className="text-sm">
        <p><b>Cliente:</b> {c.cliente_nombre}{c.cliente_doc ? ` · DNI/CUIT ${c.cliente_doc}` : ""}</p>
        <p className="text-zinc-600">{[c.cliente_telefono, c.cliente_email].filter(Boolean).join(" · ")}</p>
      </section>
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-300 text-left text-zinc-600"><tr><th className="py-2">Descripción</th><th className="py-2 text-right">Cant.</th><th className="py-2 text-right">Precio</th><th className="py-2 text-right">Subtotal</th></tr></thead>
        <tbody>{c.detalle.map((d, i) => (
          <tr key={i} className="border-b border-zinc-200"><td className="py-2">{d.descripcion}</td><td className="py-2 text-right">{d.cantidad}</td><td className="py-2 text-right">{formatoPesos(d.precio)}</td><td className="py-2 text-right">{formatoPesos(d.precio * d.cantidad)}</td></tr>))}</tbody>
      </table>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-zinc-600">{c.medio_pago ? `Forma de pago: ${c.medio_pago}` : ""}</p>
        <p className="text-2xl font-bold">Total {formatoPesos(Number(c.total))}</p>
      </div>
      <footer className="border-t border-zinc-300 pt-3 text-xs text-zinc-500">Comprobante interno, no válido como factura. Gracias por confiar en el taller.</footer>
    </article>
  );
}
