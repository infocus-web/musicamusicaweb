import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatoPesos } from "@/lib/estados";
import { finDia, inicioDia, medioLabel, rangoMes } from "@/lib/gestion";
import { PAGOS } from "@/lib/tienda";
import { SelectorMes } from "./SelectorMes";

export default async function ResumenGestion({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const r = rangoMes((await searchParams).mes);
  const supabase = await createClient();
  const [{ data: pedidos }, { data: cobros }, { data: compras }, { data: insumos }, { data: trabajosAbiertos }, { data: stockBajo }] = await Promise.all([
    supabase.from("pedidos").select("id, total, pago_metodo, pedido_items(nombre, cantidad, precio, costo)")
      .eq("pago_estado", "aprobado").gte("pagado_en", inicioDia(r.desde)).lte("pagado_en", finDia(r.hasta)),
    supabase.from("cobros").select("monto, medio").gte("fecha", r.desde).lte("fecha", r.hasta),
    supabase.from("compras").select("total").eq("anulada", false).gte("fecha", r.desde).lte("fecha", r.hasta),
    supabase.from("trabajo_insumos").select("cantidad, costo").gte("creado_en", inicioDia(r.desde)).lte("creado_en", finDia(r.hasta)),
    supabase.from("trabajos").select("id, presupuesto, cobros(monto)").in("estado", ["listo", "entregado"]).not("presupuesto", "is", null).limit(1000),
    supabase.from("productos").select("id, nombre, stock, sin_stock_vende, variantes(stock)").eq("tipo", "producto").eq("sin_stock_vende", false).limit(1000),
  ]);

  type Item = { nombre: string; cantidad: number; precio: number; costo: number | null };
  const items = (pedidos ?? []).flatMap((p) => (p.pedido_items ?? []) as Item[]);
  const ventasTienda = (pedidos ?? []).reduce((a, p) => a + Number(p.total), 0);
  const costoTienda = items.reduce((a, i) => a + Number(i.costo ?? 0) * i.cantidad, 0);
  const sinCosto = items.filter((i) => i.costo == null).length;
  const cobrosTaller = (cobros ?? []).reduce((a, c) => a + Number(c.monto), 0);
  const costoInsumos = (insumos ?? []).reduce((a, i) => a + Number(i.costo ?? 0) * i.cantidad, 0);
  const totalCompras = (compras ?? []).reduce((a, c) => a + Number(c.total), 0);
  const ingresos = ventasTienda + cobrosTaller;
  const ganancia = ingresos - costoTienda - costoInsumos;

  const porMedio = new Map<string, number>();
  for (const p of pedidos ?? []) porMedio.set(PAGOS[p.pago_metodo] ?? p.pago_metodo, (porMedio.get(PAGOS[p.pago_metodo] ?? p.pago_metodo) ?? 0) + Number(p.total));
  for (const c of cobros ?? []) porMedio.set(medioLabel(c.medio), (porMedio.get(medioLabel(c.medio)) ?? 0) + Number(c.monto));

  const masVendidos = [...items.reduce((m, i) => m.set(i.nombre, (m.get(i.nombre) ?? 0) + i.cantidad), new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const porCobrar = (trabajosAbiertos ?? []).reduce((a, t) => a + Math.max(0, Number(t.presupuesto) - ((t.cobros ?? []) as { monto: number }[]).reduce((s, c) => s + Number(c.monto), 0)), 0);
  const bajos = ((stockBajo ?? []) as { id: string; nombre: string; stock: number; variantes: { stock: number }[] }[])
    .map((p) => ({ ...p, total: p.variantes?.length ? p.variantes.reduce((a, v) => a + v.stock, 0) : p.stock })).filter((p) => p.total <= 2);

  const tarjetas: [string, number, string?][] = [
    ["Ingresos del mes", ingresos, `Tienda ${formatoPesos(ventasTienda)} · Taller ${formatoPesos(cobrosTaller)}`],
    ["Ganancia estimada", ganancia, sinCosto ? `${sinCosto} producto(s) vendidos sin costo cargado` : "Ingresos − costo de lo vendido e insumos"],
    ["Compras a proveedores", totalCompras],
    ["Por cobrar en el taller", porCobrar, "Trabajos listos o entregados con saldo"],
  ];

  return (
    <div className="space-y-5">
      <SelectorMes base="/taller/gestion" {...r} />
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map(([t, n, d]) => (
          <div key={t} className="card !p-4">
            <p className="muted text-sm">{t}</p>
            <p className="text-2xl font-bold">{formatoPesos(n)}</p>
            {d && <p className="muted text-xs">{d}</p>}
          </div>
        ))}
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card space-y-2">
          <h2 className="font-semibold">Por medio de pago</h2>
          {porMedio.size === 0 ? <p className="muted text-sm">Sin movimientos este mes.</p> : (
            <ul className="space-y-1 text-sm">{[...porMedio].sort((a, b) => b[1] - a[1]).map(([m, v]) => <li key={m} className="flex justify-between"><span>{m}</span><b>{formatoPesos(v)}</b></li>)}</ul>)}
        </section>
        <section className="card space-y-2">
          <h2 className="font-semibold">Más vendidos en la tienda</h2>
          {masVendidos.length === 0 ? <p className="muted text-sm">Sin ventas este mes.</p> : (
            <ol className="list-decimal space-y-1 pl-5 text-sm">{masVendidos.map(([n, c]) => <li key={n}><span>{n}</span> <span className="muted">· {c} u.</span></li>)}</ol>)}
        </section>
        <section className="card space-y-2">
          <h2 className="font-semibold">Stock bajo (2 o menos)</h2>
          {bajos.length === 0 ? <p className="muted text-sm">Todo bien.</p> : (
            <ul className="space-y-1 text-sm">{bajos.slice(0, 8).map((p) => <li key={p.id} className="flex justify-between gap-2"><Link href={`/taller/tienda/${p.id}`} className="link truncate">{p.nombre}</Link><b className={p.total <= 0 ? "text-red-600" : ""}>{p.total}</b></li>)}</ul>)}
          {bajos.length > 0 && <Link href="/taller/gestion/compras" className="link text-sm">Cargar una compra →</Link>}
        </section>
      </div>
    </div>
  );
}
