/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIAS_TIENDA, categoriaTiendaLabel, fotoProducto, pesos, type Producto } from "@/lib/tienda";
import { crearProducto } from "./actions";

export default async function TiendaTallerPage({ searchParams }: { searchParams: Promise<{ cat?: string; q?: string; stock?: string }> }) {
  const { cat, q, stock } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("productos").select("*, variantes(*)").order("actualizado_en", { ascending: false }).limit(500);
  if (cat) query = query.eq("categoria", cat);
  if (q) query = query.or(`nombre.ilike.%${q.replace(/[%,()]/g, " ")}%,sku.ilike.%${q.replace(/[%,()]/g, " ")}%`);
  const { data } = await query;
  let productos = (data ?? []) as Producto[];
  const stockTotal = (p: Producto) => (p.variantes?.length ? p.variantes.reduce((a, v) => a + v.stock, 0) : p.stock);
  if (stock === "bajo") productos = productos.filter((p) => p.tipo === "producto" && !p.sin_stock_vende && stockTotal(p) <= 2);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold">Tienda</h1>
          <p className="muted text-sm">{productos.length} producto(s)</p>
        </div>
        <Link href="/taller/pedidos" className="btn-ghost">Pedidos</Link>
        <Link href="/taller/tienda/envios" className="btn-ghost">Envíos</Link>
        <form action={crearProducto} className="flex gap-2">
          <input name="nombre" placeholder="Nombre del producto" className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--card)" }} />
          <select name="tipo" className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
            <option value="producto">Producto</option><option value="servicio">Servicio</option>
          </select>
          <button className="btn">+ Crear</button>
        </form>
      </div>
      <form className="flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={q} placeholder="Buscar nombre o código" className="rounded-xl border px-3 py-2" style={{ borderColor: "var(--line)", background: "var(--card)" }} />
        <select name="cat" defaultValue={cat ?? ""} className="rounded-xl border px-3 py-2" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS_TIENDA.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <label className="flex items-center gap-2"><input type="checkbox" name="stock" value="bajo" defaultChecked={stock === "bajo"} /> Solo stock bajo</label>
        <button className="btn-ghost">Filtrar</button>
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="muted text-left"><tr><th className="p-3"></th><th className="p-3">Producto</th><th className="p-3">Categoría</th><th className="p-3">Precio</th><th className="p-3">Stock</th><th className="p-3">Estado</th></tr></thead>
          <tbody>
            {productos.map((p) => {
              const st = stockTotal(p);
              const f = fotoProducto(p.fotos[0]);
              return (
                <tr key={p.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                  <td className="p-2">{f ? <img src={f} alt="" className="h-10 w-10 rounded bg-white object-contain" /> : <div className="h-10 w-10 rounded" style={{ background: "var(--line)" }} />}</td>
                  <td className="p-3"><Link href={`/taller/tienda/${p.id}`} className="link">{p.nombre}</Link>{p.sku && <span className="muted"> · {p.sku}</span>}</td>
                  <td className="p-3">{categoriaTiendaLabel(p.categoria)}</td>
                  <td className="p-3">{pesos(p.precio)}{p.variantes?.length ? <span className="muted"> ({p.variantes.length} opc.)</span> : null}</td>
                  <td className="p-3">{p.tipo === "servicio" ? "—" : p.sin_stock_vende ? "A pedido" : <span className={st <= 2 ? "font-semibold text-red-600" : ""}>{st}</span>}</td>
                  <td className="p-3"><span className={`badge ${p.activo ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"}`}>{p.activo ? "Publicado" : "Oculto"}</span></td>
                </tr>
              );
            })}
            {productos.length === 0 && <tr><td colSpan={6} className="muted p-3">No hay productos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
