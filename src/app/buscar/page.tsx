import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/SiteHeader";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import { TarjetaUsado } from "@/components/TarjetaUsado";
import type { Producto } from "@/lib/tienda";
import type { Usado } from "@/lib/usados";

export const metadata: Metadata = { title: "Buscar — Música Música Web", robots: { index: false } };

export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const s = q.replace(/[%,()]/g, " ");
  const db = createAdminClient();
  const [{ data: prods }, { data: usados }] = q
    ? await Promise.all([
        db.from("productos").select("*, variantes(*)").eq("activo", true).or(`nombre.ilike.%${s}%,marca.ilike.%${s}%,sku.ilike.%${s}%`).limit(48),
        db.from("usados").select("*").in("estado", ["publicado", "reservado"]).or(`titulo.ilike.%${s}%,marca.ilike.%${s}%,modelo.ilike.%${s}%`).limit(24),
      ])
    : [{ data: [] }, { data: [] }];
  const P = (prods ?? []) as Producto[];
  const U = (usados ?? []) as Usado[];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <h1 className="titulo text-3xl">{q ? `Resultados para “${q}”` : "Buscar"}</h1>
        {q && P.length + U.length === 0 && (
          <div className="rounded-xl p-6 text-center" style={{ background: "var(--soft)" }}>
            <p>No encontramos nada con esa búsqueda.</p>
            <p className="muted text-sm">Probá con otra palabra o <Link href="/asesor" className="link">preguntale al asesor</Link>.</p>
          </div>
        )}
        {P.length > 0 && (
          <section className="space-y-3">
            <h2 className="titulo text-xl">Tienda ({P.length})</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{P.map((p) => <TarjetaProducto key={p.id} p={p} />)}</div>
          </section>
        )}
        {U.length > 0 && (
          <section className="space-y-3">
            <h2 className="titulo text-xl">Usados ({U.length})</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{U.map((u) => <TarjetaUsado key={u.id} u={u} />)}</div>
          </section>
        )}
      </main>
    </>
  );
}
