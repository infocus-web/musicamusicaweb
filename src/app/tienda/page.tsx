import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORIAS_TIENDA, type Producto } from "@/lib/tienda";
import { SiteHeader } from "@/components/SiteHeader";
import { TarjetaProducto } from "@/components/TarjetaProducto";

export const revalidate = 60;
export const metadata: Metadata = { title: "Tienda — Música Música Web", description: "Cuerdas, accesorios, repuestos, instrumentos y servicios del taller." };

type SP = { cat?: string; q?: string; orden?: string };

export default async function TiendaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { cat, q, orden = "destacados" } = await searchParams;
  let query = createAdminClient().from("productos").select("*, variantes(*)").eq("activo", true);
  if (cat) query = query.eq("categoria", cat);
  if (q) { const s = q.replace(/[%,()]/g, " ").trim(); query = query.or(`nombre.ilike.%${s}%,marca.ilike.%${s}%,sku.ilike.%${s}%`); }
  query = orden === "precio_asc" ? query.order("precio") : orden === "precio_desc" ? query.order("precio", { ascending: false })
    : orden === "nuevos" ? query.order("creado_en", { ascending: false }) : query.order("destacado", { ascending: false }).order("nombre");
  const { data } = await query.limit(300);
  const productos = (data ?? []) as Producto[];

  const href = (p: Partial<SP>) => {
    const sp = new URLSearchParams(Object.entries({ cat, q, orden, ...p }).filter(([k, v]) => v && !(k === "orden" && v === "destacados")) as [string, string][]);
    return sp.size ? `/tienda?${sp}` : "/tienda";
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--accent)" }}>Tienda</p>
          <h1 className="titulo text-4xl">Insumos, accesorios e instrumentos</h1>
          <p className="muted">Pagá con Mercado Pago, transferencia o en efectivo al retirar. Envíos a todo el país.</p>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-1 text-sm">
          <Link href={href({ cat: undefined })} className={`${!cat ? "btn" : "btn-ghost"} !py-1.5 whitespace-nowrap`}>Todo</Link>
          {CATEGORIAS_TIENDA.map((c) => <Link key={c.id} href={href({ cat: c.id })} className={`${cat === c.id ? "btn" : "btn-ghost"} !py-1.5 whitespace-nowrap`}>{c.label}</Link>)}
          <Link href="/usados" className="btn-ghost !py-1.5 whitespace-nowrap">Usados →</Link>
        </div>
        <form action="/tienda" className="flex flex-wrap gap-2">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <input name="q" defaultValue={q} placeholder="Buscar producto, marca o código…" className="min-w-[200px] flex-1 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--card)" }} />
          <select name="orden" defaultValue={orden} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
            <option value="destacados">Destacados</option><option value="nuevos">Más nuevos</option>
            <option value="precio_asc">Menor precio</option><option value="precio_desc">Mayor precio</option>
          </select>
          <button className="btn-ghost">Buscar</button>
        </form>

        {productos.length === 0 ? (
          <p className="card muted text-center">{cat || q ? "No encontramos productos con ese filtro." : "Estamos cargando la tienda. Muy pronto vas a poder comprar online."}</p>
        ) : (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {productos.map((p) => <TarjetaProducto key={p.id} p={p} />)}
          </section>
        )}
      </main>
    </>
  );
}
