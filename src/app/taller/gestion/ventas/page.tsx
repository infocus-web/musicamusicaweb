import Link from "next/link";
import { formatoFecha, formatoPesos } from "@/lib/estados";
import { rangoMes } from "@/lib/gestion";
import { listarVentas } from "@/lib/ventas";

export default async function VentasPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string; origen?: string }> }) {
  const sp = await searchParams;
  const mes = rangoMes();
  const ok = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
  const desde = ok(sp.desde) ?? mes.desde, hasta = ok(sp.hasta) ?? mes.hasta;
  const origen = sp.origen === "tienda" || sp.origen === "taller" ? sp.origen : "";
  const ventas = await listarVentas(desde, hasta, origen);
  const total = ventas.reduce((a, v) => a + v.monto, 0);
  const q = `desde=${desde}&hasta=${hasta}${origen ? `&origen=${origen}` : ""}`;
  const campo = "rounded-xl border px-3 py-2 text-sm";
  const estilo = { borderColor: "var(--line)", background: "var(--card)" };

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-2">
        <label className="field"><span>Desde</span><input type="date" name="desde" defaultValue={desde} className={campo} style={estilo} /></label>
        <label className="field"><span>Hasta</span><input type="date" name="hasta" defaultValue={hasta} className={campo} style={estilo} /></label>
        <label className="field"><span>Origen</span>
          <select name="origen" defaultValue={origen} className={campo} style={estilo}><option value="">Todo</option><option value="tienda">Tienda online</option><option value="taller">Cobros del taller</option></select>
        </label>
        <button className="btn-ghost">Filtrar</button>
        <a href={`/taller/gestion/ventas/csv?${q}`} className="btn ml-auto">⬇ Descargar Excel (CSV)</a>
      </form>
      <div className="card flex flex-wrap items-baseline justify-between gap-2 !p-4">
        <span className="muted text-sm">{ventas.length} movimiento(s) del {formatoFecha(desde)} al {formatoFecha(hasta)}</span>
        <span className="text-xl font-bold">{formatoPesos(total)}</span>
      </div>
      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead className="muted text-left"><tr><th className="p-3">Fecha</th><th className="p-3">Origen</th><th className="p-3">Referencia</th><th className="p-3">Cliente</th><th className="p-3">Medio</th><th className="p-3 text-right">Monto</th></tr></thead>
          <tbody>
            {ventas.map((v, i) => (
              <tr key={i} className="border-t" style={{ borderColor: "var(--line)" }}>
                <td className="p-3 whitespace-nowrap">{formatoFecha(v.fecha)}</td>
                <td className="p-3"><span className={`badge ${v.origen === "Tienda" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"}`}>{v.origen}</span></td>
                <td className="p-3"><Link href={v.link} className="link font-mono">{v.referencia}</Link></td>
                <td className="p-3">{v.cliente}</td>
                <td className="p-3">{v.medio}</td>
                <td className="p-3 text-right font-semibold">{formatoPesos(v.monto)}</td>
              </tr>
            ))}
            {ventas.length === 0 && <tr><td colSpan={6} className="muted p-3">No hay ventas ni cobros en esas fechas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
