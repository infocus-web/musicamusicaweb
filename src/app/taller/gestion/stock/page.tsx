import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatoFechaHora, formatoPesos } from "@/lib/estados";
import { filtrosBusqueda } from "@/lib/busqueda";
import { ajustarStock, guardarCosto } from "./actions";

const MOTIVOS: Record<string, string> = { inicial: "Carga inicial", compra: "Compra", venta: "Venta / uso", cancelacion: "Devolución", ajuste: "Ajuste" };

export default async function StockPage({ searchParams }: { searchParams: Promise<{ q?: string; bajo?: string }> }) {
  const { q, bajo } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("productos").select("id, nombre, sku, stock, precio, sin_stock_vende, variantes(id, nombre, stock, precio)").eq("tipo", "producto").order("nombre").limit(500);
  if (q) for (const f of filtrosBusqueda(q, ["nombre", "sku", "marca"])) query = query.or(f);
  const [{ data: productos }, { data: costos }, { data: movimientos }] = await Promise.all([
    query,
    supabase.from("costos").select("producto_id, variante_id, costo"),
    supabase.from("stock_movimientos").select("id, cantidad, stock_resultante, motivo, referencia, nota, creado_en, productos(nombre), variantes(nombre)").order("creado_en", { ascending: false }).limit(40),
  ]);
  const costoDe = (p: string, v: string | null) => costos?.find((c) => c.producto_id === p && (c.variante_id ?? null) === v)?.costo ?? null;
  type P = { id: string; nombre: string; sku: string | null; stock: number; precio: number; sin_stock_vende: boolean; variantes: { id: string; nombre: string; stock: number; precio: number | null }[] };
  let filas = ((productos ?? []) as P[]).flatMap((p) => p.variantes?.length
    ? p.variantes.map((v) => ({ key: v.id, producto: p.id, variante: v.id as string | null, nombre: `${p.nombre} — ${v.nombre}`, stock: v.stock, precio: Number(v.precio ?? p.precio), costo: costoDe(p.id, v.id) }))
    : [{ key: p.id, producto: p.id, variante: null as string | null, nombre: p.nombre, stock: p.stock, precio: Number(p.precio), costo: costoDe(p.id, null) }]);
  if (bajo) filas = filas.filter((f) => f.stock <= 2);
  const valorCosto = filas.reduce((a, f) => a + Math.max(f.stock, 0) * Number(f.costo ?? 0), 0);
  const valorVenta = filas.reduce((a, f) => a + Math.max(f.stock, 0) * f.precio, 0);
  const unidades = filas.reduce((a, f) => a + Math.max(f.stock, 0), 0);
  const chico = "w-20 rounded-lg border px-2 py-1 text-sm";
  const est = { borderColor: "var(--line)", background: "var(--bg)" };

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card !p-4"><p className="muted text-sm">Unidades en stock</p><p className="text-2xl font-bold">{unidades}</p></div>
        <div className="card !p-4"><p className="muted text-sm">Valor al costo</p><p className="text-2xl font-bold">{formatoPesos(valorCosto)}</p></div>
        <div className="card !p-4"><p className="muted text-sm">Valor a precio de venta</p><p className="text-2xl font-bold">{formatoPesos(valorVenta)}</p></div>
      </section>
      <form className="flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={q} placeholder="Buscar producto o código" className="rounded-xl border px-3 py-2" style={{ borderColor: "var(--line)", background: "var(--card)" }} />
        <label className="flex items-center gap-2"><input type="checkbox" name="bajo" value="1" defaultChecked={!!bajo} /> Solo stock bajo</label>
        <button className="btn-ghost">Filtrar</button>
        <Link href="/taller/gestion/compras" className="btn ml-auto">+ Cargar compra</Link>
      </form>
      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead className="muted text-left"><tr><th className="p-3">Producto</th><th className="p-3">Precio</th><th className="p-3">Costo</th><th className="p-3">Margen</th><th className="p-3">Stock</th><th className="p-3">Ajustar (conteo)</th></tr></thead>
          <tbody>
            {filas.map((f) => {
              const margen = f.costo != null && f.precio > 0 ? Math.round(((f.precio - Number(f.costo)) / f.precio) * 100) : null;
              return (
                <tr key={f.key} className="border-t align-middle" style={{ borderColor: "var(--line)" }}>
                  <td className="p-3"><Link href={`/taller/tienda/${f.producto}`} className="link">{f.nombre}</Link></td>
                  <td className="p-3 whitespace-nowrap">{formatoPesos(f.precio)}</td>
                  <td className="p-3">
                    <form action={guardarCosto.bind(null, f.producto, f.variante)} className="flex items-center gap-1">
                      <input name="costo" inputMode="decimal" defaultValue={f.costo ?? ""} placeholder="—" className={chico} style={est} aria-label={`Costo de ${f.nombre}`} />
                      <button className="muted text-xs hover:underline">OK</button>
                    </form>
                  </td>
                  <td className="p-3">{margen == null ? "—" : <span className={margen < 20 ? "text-red-600" : ""}>{margen}%</span>}</td>
                  <td className={`p-3 font-semibold ${f.stock <= 0 ? "text-red-600" : f.stock <= 2 ? "text-amber-600" : ""}`}>{f.stock}</td>
                  <td className="p-3">
                    <form action={ajustarStock.bind(null, f.producto, f.variante)} className="flex items-center gap-1">
                      <input name="nuevo" type="number" min={0} defaultValue={f.stock} className={chico} style={est} aria-label="Stock contado" />
                      <input name="nota" placeholder="Motivo" className="w-28 rounded-lg border px-2 py-1 text-sm" style={est} />
                      <button className="muted text-xs hover:underline">Ajustar</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {filas.length === 0 && <tr><td colSpan={6} className="muted p-3">No hay productos con esos filtros.</td></tr>}
          </tbody>
        </table>
      </div>
      <section className="card space-y-2">
        <h2 className="font-semibold">Últimos movimientos</h2>
        {(movimientos ?? []).length === 0 ? <p className="muted text-sm">Todavía no hay movimientos. Se registran solos con cada venta, compra, uso en el taller o ajuste.</p> : (
          <ul className="divide-y text-sm">{movimientos!.map((m) => {
            const nombre = [(m.productos as unknown as { nombre: string } | null)?.nombre, (m.variantes as unknown as { nombre: string } | null)?.nombre].filter(Boolean).join(" — ");
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-2 py-2" style={{ borderColor: "var(--line)" }}>
                <span className="muted w-36 text-xs">{formatoFechaHora(m.creado_en)}</span>
                <span className="flex-1">{nombre}</span>
                <span className="muted text-xs">{MOTIVOS[m.motivo] ?? m.motivo}{m.referencia ? ` · ${m.referencia}` : ""}{m.nota ? ` · ${m.nota}` : ""}</span>
                <b className={m.cantidad < 0 ? "text-red-600" : "text-emerald-600"}>{m.cantidad > 0 ? "+" : ""}{m.cantidad}</b>
                <span className="muted text-xs">→ {m.stock_resultante}</span>
              </li>
            );
          })}</ul>)}
      </section>
    </div>
  );
}
