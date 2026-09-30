import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORIAS_USADOS, seccionInfo, type Usado } from "@/lib/usados";
import { PildorasSecciones } from "@/components/PildorasSecciones";
import { SiteHeader } from "@/components/SiteHeader";
import { TarjetaUsado } from "@/components/TarjetaUsado";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Usados revisados — Música Música Web",
  description: "Instrumentos y equipos usados, revisados y puestos a punto en nuestro taller. Con garantía y permuta.",
};

type SP = { cat?: string; orden?: string; q?: string; seccion?: string };

export default async function UsadosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { cat, orden = "recientes", q, seccion } = await searchParams;
  const sec = seccion ? seccionInfo(seccion) : null;
  const db = createAdminClient();

  let query = db.from("usados").select("*").in("estado", ["publicado", "reservado"]);
  if (cat) query = query.eq("categoria", cat);
  if (sec) query = query.eq("seccion", sec.id);
  if (q) {
    const s = q.replace(/[%,()]/g, " ").trim();
    query = query.or(`titulo.ilike.%${s}%,marca.ilike.%${s}%,modelo.ilike.%${s}%`);
  }
  query =
    orden === "precio_asc" ? query.order("precio", { ascending: true, nullsFirst: false }) :
    orden === "precio_desc" ? query.order("precio", { ascending: false, nullsFirst: false }) :
    query.order("destacado", { ascending: false }).order("publicado_en", { ascending: false, nullsFirst: false });
  const { data } = await query.limit(120);
  const usados = (data ?? []) as Usado[];

  const { data: vend } = await db.from("usados").select("*").eq("estado", "vendido").order("vendido_en", { ascending: false }).limit(4);
  const vendidos = (vend ?? []) as Usado[];

  const href = (p: Partial<SP>) => {
    const sp = new URLSearchParams();
    const m = { cat, orden, q, seccion, ...p };
    Object.entries(m).forEach(([k, v]) => v && !(k === "orden" && v === "recientes") && sp.set(k, v));
    const s = sp.toString();
    return s ? `/usados?${s}` : "/usados";
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section className="space-y-3">
          <PildorasSecciones activa={sec?.id} href={(s) => href({ seccion: s })} />
          <h1 className="pt-2 text-3xl sm:text-4xl font-semibold">{sec ? sec.label : "Usados con el respaldo del taller"}</h1>
          <p className="muted max-w-2xl">
            {sec ? sec.bajada : "Cada instrumento pasa por nuestro banco de trabajo antes de publicarse: lo revisamos, lo ponemos a punto y te contamos exactamente qué le hicimos. Aceptamos tu usado en parte de pago."}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/usados/vender" className="btn">Vendé o permutá tu instrumento</Link>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link href={href({ cat: undefined })} className={!cat ? "btn !py-1.5" : "btn-ghost !py-1.5"}>Todos</Link>
            {CATEGORIAS_USADOS.map((c) => (
              <Link key={c.id} href={href({ cat: c.id })} className={`${cat === c.id ? "btn" : "btn-ghost"} !py-1.5 whitespace-nowrap`}>{c.label}</Link>
            ))}
          </div>
          <form className="flex flex-wrap gap-2" action="/usados">
            {cat && <input type="hidden" name="cat" value={cat} />}
            {seccion && <input type="hidden" name="seccion" value={seccion} />}
            <input name="q" defaultValue={q} placeholder="Buscar marca o modelo…" className="flex-1 min-w-[180px] rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--card)" }} />
            <select name="orden" defaultValue={orden} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
              <option value="recientes">Más recientes</option>
              <option value="precio_asc">Menor precio</option>
              <option value="precio_desc">Mayor precio</option>
            </select>
            <button className="btn-ghost">Aplicar</button>
          </form>
        </section>

        {usados.length === 0 ? (
          <div className="card text-center muted">
            {cat || q ? "No hay usados con ese filtro ahora." : "Pronto vamos a publicar los primeros usados."}{" "}
            <Link href="/usados/vender" className="link">¿Tenés uno para vender?</Link>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {usados.map((u) => <TarjetaUsado key={u.id} u={u} />)}
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["Revisados en taller", "Cada uno pasa por el banco: electrónica, calibración, trastes y limpieza. Te detallamos qué se hizo."],
            ["Garantía", "Los usados revisados tienen garantía del taller. El plazo figura en cada publicación."],
            ["Permuta", "Tomamos tu instrumento en parte de pago. Pedí la tasación online con fotos."],
          ].map(([t, d]) => (
            <div key={t} className="card border-t-4 space-y-1" style={{ borderTopColor: "var(--accent)" }}>
              <h2 className="font-semibold">{t}</h2>
              <p className="muted text-sm">{d}</p>
            </div>
          ))}
        </section>

        {vendidos.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Vendidos recientemente</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {vendidos.map((u) => <TarjetaUsado key={u.id} u={u} />)}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
