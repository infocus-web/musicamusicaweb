/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { estrellas, urlCaso, type Caso, type Resena } from "@/lib/casos";
import { formatoFechaHora } from "@/lib/estados";
import { aprobarResena, nuevoCaso } from "./actions";

export default async function NuestrosClientesTallerPage() {
  const supabase = await createClient();
  const [{ data: casos }, { data: resenas }] = await Promise.all([
    supabase.from("casos").select("*").order("orden", { ascending: false }).order("creado_en", { ascending: false }),
    supabase.from("resenas").select("*, clientes(nombre, codigo), trabajos(numero)").order("creado_en", { ascending: false }).limit(100),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="mr-auto">
            <h1 className="text-2xl font-semibold">Nuestros clientes</h1>
            <p className="muted text-sm">Trabajos que se muestran en <Link href="/nuestros-clientes" target="_blank" className="link">/nuestros-clientes</Link>. Para crear uno desde una orden, entrá a la orden y tocá “Mostrar en Nuestros clientes”.</p>
          </div>
          <form action={nuevoCaso}><button className="btn-ghost">+ Cargar a mano</button></form>
        </div>
        {(casos ?? []).length === 0 && <p className="card muted">Todavía no hay trabajos cargados.</p>}
        <ul className="grid gap-3 sm:grid-cols-2">
          {((casos ?? []) as Caso[]).map((c) => {
            const portada = c.media.find((m) => m.tipo === "foto");
            return (
              <li key={c.id}>
                <Link href={`/taller/nuestros-clientes/${c.id}`} className="card flex gap-3 !p-3 hover:shadow-sm">
                  <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--line)" }}>
                    {portada && <img src={urlCaso(portada.path)} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <span className={`badge ${c.publicado ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"}`}>{c.publicado ? "Publicado" : "Borrador"}</span>
                    <p className="truncate font-medium">{c.titulo}</p>
                    <p className="muted text-xs">{c.media.length} archivo(s){c.resena_id ? " · con opinión" : ""}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="space-y-3">
        <h2 className="text-lg font-semibold">Opiniones de clientes</h2>
        <p className="muted text-xs">Los clientes opinan desde su link cuando el trabajo está listo. Solo se publican las que ellos autorizaron y vos aprobás.</p>
        {(resenas ?? []).length === 0 && <p className="card muted text-sm">Todavía no hay opiniones.</p>}
        {((resenas ?? []) as (Resena & { clientes: { nombre: string; codigo: string } | null; trabajos: { numero: string } | null })[]).map((r) => (
          <article key={r.id} className="card space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span style={{ color: "#f5b301" }}>{estrellas(r.puntaje)}</span>
              <span className="muted ml-auto text-xs">{formatoFechaHora(r.creado_en)}</span>
            </div>
            {r.comentario && <p>“{r.comentario}”</p>}
            <p className="muted text-xs">{r.clientes?.nombre} ({r.clientes?.codigo}) · {r.trabajos?.numero ?? ""} · {r.autoriza_publicar ? "autorizó publicar" : "NO autorizó publicar"}</p>
            {r.autoriza_publicar && (
              <form action={aprobarResena.bind(null, r.id, !r.aprobada)}>
                <button className={r.aprobada ? "btn-ghost !py-1" : "btn !py-1"}>{r.aprobada ? "Quitar de la web" : "Aprobar y mostrar"}</button>
              </form>
            )}
          </article>
        ))}
      </aside>
    </div>
  );
}
