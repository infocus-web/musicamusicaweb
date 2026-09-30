import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIAS_TIENDA, type Producto } from "@/lib/tienda";
import { EditorFotos } from "@/components/EditorFotos";
import { borrarProducto, guardarFotosProducto, guardarProducto } from "../actions";
import { Variantes } from "./Variantes";
import { CampoVideos } from "@/components/CampoVideos";

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("productos").select("*, variantes(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as Producto;
  const vs = (p.variantes ?? []).sort((a, b) => a.orden - b.orden);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <Link href="/taller/tienda" className="muted text-sm hover:underline">← Tienda</Link>
          <h1 className="text-2xl font-semibold">{p.nombre}</h1>
        </div>
        {p.activo && <Link href={`/tienda/${p.slug}`} target="_blank" className="btn-ghost">Ver en la tienda</Link>}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <form action={guardarProducto.bind(null, p.id)} className="card grid gap-3 sm:grid-cols-2">
          <label className="field sm:col-span-2"><span>Nombre</span><input name="nombre" defaultValue={p.nombre} required /></label>
          <label className="field"><span>Tipo</span>
            <select name="tipo" defaultValue={p.tipo}><option value="producto">Producto</option><option value="servicio">Servicio del taller</option></select>
          </label>
          <label className="field"><span>Categoría</span>
            <select name="categoria" defaultValue={p.categoria}>{CATEGORIAS_TIENDA.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          </label>
          <label className="field"><span>Marca</span><input name="marca" defaultValue={p.marca ?? ""} /></label>
          <label className="field"><span>Código / SKU</span><input name="sku" defaultValue={p.sku ?? ""} /></label>
          <label className="field"><span>Precio ($)</span><input name="precio" inputMode="decimal" defaultValue={p.precio} required /></label>
          <label className="field"><span>Precio anterior (tachado)</span><input name="precio_anterior" inputMode="decimal" defaultValue={p.precio_anterior ?? ""} /></label>
          <label className="field"><span>Stock (si no tiene opciones)</span><input name="stock" inputMode="numeric" defaultValue={p.stock} /></label>
          <div className="flex flex-col justify-end gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="sin_stock_vende" defaultChecked={p.sin_stock_vende} /> Vender aunque no haya stock (a pedido)</label>
          </div>
          <Variantes iniciales={vs.map((v) => ({ id: v.id, nombre: v.nombre, precio: v.precio, stock: v.stock }))} />
          <label className="field sm:col-span-2"><span>Descripción</span><textarea name="descripcion" rows={6} defaultValue={p.descripcion ?? ""} /></label>
          <CampoVideos inicial={p.videos ?? []} className="sm:col-span-2" />
          <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
            <label className="flex items-center gap-2"><input type="checkbox" name="activo" defaultChecked={p.activo} /> Publicado en la tienda</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="destacado" defaultChecked={p.destacado} /> Destacado</label>
          </div>
          <div className="flex items-center justify-between sm:col-span-2">
            <button formAction={borrarProducto.bind(null, p.id)} formNoValidate className="text-sm text-red-600 hover:underline">Borrar</button>
            <button className="btn">Guardar</button>
          </div>
        </form>
        <EditorFotos carpeta={p.id} bucket="productos" iniciales={p.fotos} guardar={guardarFotosProducto.bind(null, p.id)} />
      </div>
    </div>
  );
}
