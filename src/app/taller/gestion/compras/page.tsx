import { createClient } from "@/lib/supabase/server";
import { formatoFecha, formatoPesos } from "@/lib/estados";
import { NuevaCompra } from "./NuevaCompra";
import { anularCompra } from "./actions";

export default async function ComprasPage() {
  const supabase = await createClient();
  const [{ data: compras }, { data: proveedores }, { data: productos }, { data: costos }] = await Promise.all([
    supabase.from("compras").select("id, numero, fecha, comprobante, total, anulada, notas, proveedores(nombre), compra_items(nombre, cantidad, costo_unitario)").order("fecha", { ascending: false }).order("creado_en", { ascending: false }).limit(100),
    supabase.from("proveedores").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("productos").select("id, nombre, variantes(id, nombre)").eq("tipo", "producto").order("nombre").limit(1000),
    supabase.from("costos").select("producto_id, variante_id, costo"),
  ]);
  const costoDe = (p: string, v: string | null) => costos?.find((c) => c.producto_id === p && (c.variante_id ?? null) === v)?.costo ?? null;
  const opciones = ((productos ?? []) as { id: string; nombre: string; variantes: { id: string; nombre: string }[] }[]).flatMap((p) =>
    p.variantes?.length ? p.variantes.map((v) => ({ valor: `${p.id}|${v.id}`, label: `${p.nombre} — ${v.nombre}`, costo: costoDe(p.id, v.id) })) : [{ valor: `${p.id}|`, label: p.nombre, costo: costoDe(p.id, null) }]);

  return (
    <div className="space-y-5">
      <NuevaCompra proveedores={proveedores ?? []} opciones={opciones} />
      <section className="space-y-2">
        <h2 className="font-semibold">Compras registradas</h2>
        {(compras ?? []).length === 0 && <p className="card muted text-sm">Todavía no hay compras.</p>}
        {(compras ?? []).map((c) => (
          <details key={c.id} className="card !p-0">
            <summary className="flex cursor-pointer flex-wrap items-center gap-3 p-4 text-sm">
              <span className="font-mono">{c.numero}</span>
              <span className="muted">{formatoFecha(c.fecha)}</span>
              <span className="flex-1">{(c.proveedores as unknown as { nombre: string } | null)?.nombre ?? "Sin proveedor"}{c.comprobante ? ` · ${c.comprobante}` : ""}</span>
              {c.anulada && <span className="badge bg-red-100 text-red-700">Anulada</span>}
              <b className={c.anulada ? "line-through" : ""}>{formatoPesos(Number(c.total))}</b>
            </summary>
            <div className="space-y-2 border-t p-4 text-sm" style={{ borderColor: "var(--line)" }}>
              <ul className="space-y-1">{((c.compra_items ?? []) as { nombre: string; cantidad: number; costo_unitario: number }[]).map((i, k) => (
                <li key={k} className="flex justify-between gap-2"><span>{i.cantidad} × {i.nombre}</span><span>{formatoPesos(i.cantidad * Number(i.costo_unitario))}</span></li>))}</ul>
              {c.notas && <p className="muted">{c.notas}</p>}
              {!c.anulada && <form action={anularCompra.bind(null, c.id)}><button className="text-sm text-red-600 hover:underline">Anular compra (resta el stock que había sumado)</button></form>}
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
