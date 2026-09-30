/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORIAS_USADOS, CONDICIONES, SECCIONES, categoriaLabel, fotoUsado, seccionInfo, type Usado } from "@/lib/usados";
import { SiteHeader } from "@/components/SiteHeader";
import { TarjetaUsado } from "@/components/TarjetaUsado";
import { PildorasSecciones } from "@/components/PildorasSecciones";
import { IconoCategoria } from "@/components/IconoCategoria";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Usados revisados — Música Música Web",
  description: "Instrumentos y equipos usados, revisados y puestos a punto en nuestro taller. Con garantía y permuta.",
};

type SP = { cat?: string; orden?: string; q?: string; seccion?: string; marca?: string | string[]; cond?: string | string[]; min?: string; max?: string };
const lista = (v?: string | string[]) => (Array.isArray(v) ? v : v ? [v] : []);
const numero = (v?: string) => { const n = Number(String(v ?? "").replace(/\D/g, "")); return n > 0 ? n : null; };

export default async function UsadosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { cat, orden = "recientes", q, seccion } = sp;
  const marcas = lista(sp.marca), conds = lista(sp.cond);
  const min = numero(sp.min), max = numero(sp.max);
  const sec = seccion ? seccionInfo(seccion) : null;

  // El catálogo de usados es chico: traemos todo lo publicado y filtramos acá para poder mostrar contadores.
  const db = createAdminClient();
  const { data } = await db.from("usados").select("*").in("estado", ["publicado", "reservado"]).limit(1000);
  const todos = (data ?? []) as Usado[];
  const { data: vend } = await db.from("usados").select("*").eq("estado", "vendido").order("vendido_en", { ascending: false }).limit(5);
  const vendidos = (vend ?? []) as Usado[];

  const texto = (q ?? "").toLowerCase().trim();
  const pasa = (u: Usado, omitir?: "cat" | "marca" | "cond" | "seccion") =>
    (omitir === "seccion" || !sec || u.seccion === sec.id) &&
    (omitir === "cat" || !cat || u.categoria === cat) &&
    (omitir === "marca" || !marcas.length || (u.marca && marcas.includes(u.marca))) &&
    (omitir === "cond" || !conds.length || conds.includes(u.condicion)) &&
    (!min || (u.precio ?? 0) >= min) && (!max || (u.precio ?? Infinity) <= max) &&
    (!texto || [u.titulo, u.marca, u.modelo].some((x) => x?.toLowerCase().includes(texto)));

  let usados = todos.filter((u) => pasa(u));
  usados = usados.sort((a, b) =>
    orden === "precio_asc" ? (a.precio ?? 9e15) - (b.precio ?? 9e15) :
    orden === "precio_desc" ? (b.precio ?? 0) - (a.precio ?? 0) :
    Number(b.destacado) - Number(a.destacado) || (b.publicado_en ?? "").localeCompare(a.publicado_en ?? ""));

  const contar = (campo: "cat" | "marca" | "cond", valor: string) =>
    todos.filter((u) => pasa(u, campo) && (campo === "cat" ? u.categoria === valor : campo === "marca" ? u.marca === valor : u.condicion === valor)).length;
  const marcasDisp = [...new Set(todos.map((u) => u.marca).filter(Boolean) as string[])]
    .map((m) => [m, contar("marca", m)] as const).sort((a, b) => b[1] - a[1]);

  const href = (p: Partial<Record<keyof SP, string | string[] | undefined>>) => {
    const u = new URLSearchParams();
    const m: Record<string, unknown> = { cat, orden, q, seccion, marca: marcas, cond: conds, min: sp.min, max: sp.max, ...p };
    Object.entries(m).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((x) => u.append(k, x));
      else if (v && !(k === "orden" && v === "recientes")) u.set(k, String(v));
    });
    const s = u.toString();
    return s ? `/usados?${s}` : "/usados";
  };
  const alternar = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const hayFiltros = !!(cat || marcas.length || conds.length || min || max || q);

  // Foto de cada categoría (primer usado con foto)
  const fotoCat = (id: string) => fotoUsado(todos.find((u) => u.categoria === id && u.fotos.length)?.fotos[0]);
  const catsConStock = CATEGORIAS_USADOS.filter((c) => todos.some((u) => u.categoria === c.id));

  const Check = ({ on, label, n, to }: { on: boolean; label: string; n: number; to: string }) => (
    <Link href={to} scroll={false} className={`flex items-center gap-2 py-1 text-sm hover:underline ${n === 0 && !on ? "pointer-events-none opacity-40" : ""}`}>
      <span className="grid h-4 w-4 place-items-center rounded-sm border" style={{ borderColor: on ? "var(--accent)" : "#999", background: on ? "var(--accent)" : "white" }}>
        {on && <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="white" strokeWidth="4" aria-hidden><path d="M5 12l5 5L20 7" /></svg>}
      </span>
      <span className="flex-1">{label}</span><span className="muted text-xs">({n})</span>
    </Link>
  );

  const Filtros = (
    <div className="space-y-6">
      <form action="/usados" className="space-y-2 rounded-lg p-4" style={{ background: "var(--soft)" }}>
        {Object.entries({ cat, seccion, orden, q }).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
        {marcas.map((m) => <input key={m} type="hidden" name="marca" value={m} />)}
        {conds.map((c) => <input key={c} type="hidden" name="cond" value={c} />)}
        <p className="titulo text-sm">Precio</p>
        <div className="flex items-center gap-2">
          <input name="min" defaultValue={sp.min} placeholder="$ Mín" inputMode="numeric" className="w-full rounded border bg-white px-2 py-2 text-sm" style={{ borderColor: "var(--line)" }} />
          <span className="muted">–</span>
          <input name="max" defaultValue={sp.max} placeholder="$ Máx" inputMode="numeric" className="w-full rounded border bg-white px-2 py-2 text-sm" style={{ borderColor: "var(--line)" }} />
        </div>
        <button className="w-full rounded bg-red-600 py-2 text-sm font-bold text-white">Aplicar</button>
      </form>

      <div className="space-y-1 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        <p className="titulo mb-2 text-sm">Sección</p>
        {SECCIONES.map((s) => <Check key={s.id} on={seccion === s.id} label={s.label} n={todos.filter((u) => pasa(u, "seccion") && u.seccion === s.id).length} to={href({ seccion: seccion === s.id ? undefined : s.id })} />)}
      </div>
      <div className="space-y-1 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        <p className="titulo mb-2 text-sm">Categoría</p>
        {CATEGORIAS_USADOS.map((c) => <Check key={c.id} on={cat === c.id} label={c.label} n={contar("cat", c.id)} to={href({ cat: cat === c.id ? undefined : c.id })} />)}
      </div>
      {marcasDisp.length > 0 && (
        <div className="space-y-1 border-t pt-4" style={{ borderColor: "var(--line)" }}>
          <p className="titulo mb-2 text-sm">Marca</p>
          {marcasDisp.slice(0, 15).map(([m, n]) => <Check key={m} on={marcas.includes(m)} label={m} n={n} to={href({ marca: alternar(marcas, m) })} />)}
        </div>
      )}
      <div className="space-y-1 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        <p className="titulo mb-2 text-sm">Condición</p>
        {CONDICIONES.map((c) => <Check key={c.id} on={conds.includes(c.id)} label={c.label} n={contar("cond", c.id)} to={href({ cond: alternar(conds, c.id) })} />)}
      </div>
      {hayFiltros && <Link href={href({ cat: undefined, marca: [], cond: [], min: undefined, max: undefined, q: undefined })} className="link text-sm">Limpiar filtros</Link>}
    </div>
  );

  const Promo = (
    <Link href="/usados/vender" className="flex h-full min-h-[320px] flex-col justify-between rounded-lg bg-gradient-to-br from-red-600 to-red-900 p-5 text-white">
      <p className="text-xs font-bold uppercase tracking-widest text-white/80">Permuta y tasación</p>
      <div>
        <p className="titulo text-4xl leading-none">Vendenos tu equipo</p>
        <p className="mt-2 text-sm text-white/90">O entregalo en parte de pago. Mandanos fotos y te pasamos la tasación.</p>
      </div>
      <span className="w-fit border-b-2 border-white pb-0.5 text-sm font-bold uppercase">Cotizar mi usado →</span>
    </Link>
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        <nav className="muted text-sm"><Link href="/" className="hover:underline">Inicio</Link> / <span>Usados</span>{sec && <> / <span>{sec.label}</span></>}</nav>

        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="titulo text-4xl sm:text-5xl">{sec ? sec.label : "Usados revisados"}</h1>
            <p className="muted max-w-2xl">{sec ? sec.bajada : "Cada instrumento pasa por nuestro banco de trabajo antes de publicarse: lo revisamos, lo ponemos a punto y te contamos qué le hicimos."}</p>
          </div>
          <PildorasSecciones activa={sec?.id} href={(s) => href({ seccion: s })} />
        </header>

        {catsConStock.length > 1 && (
          <section className="sin-barra flex gap-6 overflow-x-auto pb-2">
            {catsConStock.map((c) => {
              const f = fotoCat(c.id);
              return (
                <Link key={c.id} href={href({ cat: cat === c.id ? undefined : c.id })} className="group w-24 shrink-0 space-y-2 text-center sm:w-28">
                  <div className="mx-auto grid aspect-square w-full place-items-center overflow-hidden rounded-full border-2" style={{ borderColor: cat === c.id ? "var(--accent)" : "transparent", background: "var(--soft)" }}>
                    {f ? <img src={f} alt="" className="h-4/5 w-4/5 object-contain transition group-hover:scale-110" /> : <IconoCategoria cat={c.id} />}
                  </div>
                  <p className="text-xs leading-tight">{c.label}</p>
                </Link>
              );
            })}
          </section>
        )}

        {marcasDisp.length > 1 && (
          <section className="space-y-2">
            <p className="titulo text-sm">Comprar por marca</p>
            <div className="flex flex-wrap gap-2">
              {marcasDisp.slice(0, 14).map(([m]) => (
                <Link key={m} href={href({ marca: alternar(marcas, m) })} className="rounded-full px-4 py-1.5 text-sm transition hover:bg-zinc-200"
                  style={{ background: marcas.includes(m) ? "var(--accent)" : "var(--soft)", color: marcas.includes(m) ? "white" : undefined }}>{m}</Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="hidden lg:block">
            <p className="titulo mb-4 text-lg">Refinar resultados</p>
            {Filtros}
          </aside>
          <details className="rounded-lg border p-3 lg:hidden" style={{ borderColor: "var(--line)" }}>
            <summary className="cursor-pointer font-semibold">Filtrar{hayFiltros ? " (activos)" : ""}</summary>
            <div className="pt-4">{Filtros}</div>
          </details>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <form action="/usados" className="flex gap-2">
                {Object.entries({ cat, seccion, q }).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
                {marcas.map((m) => <input key={m} type="hidden" name="marca" value={m} />)}
                {conds.map((c) => <input key={c} type="hidden" name="cond" value={c} />)}
                <select name="orden" defaultValue={orden} className="rounded border bg-white px-3 py-2 text-sm" style={{ borderColor: "var(--line)" }}>
                  <option value="recientes">Más recientes</option>
                  <option value="precio_asc">Menor precio</option>
                  <option value="precio_desc">Mayor precio</option>
                </select>
                <button className="btn-ghost !py-2">Ordenar</button>
              </form>
              <p className="text-sm font-semibold">{usados.length} {usados.length === 1 ? "resultado" : "resultados"}{cat ? ` en ${categoriaLabel(cat)}` : ""}</p>
            </div>

            {usados.length === 0 ? (
              <div className="rounded-lg p-8 text-center" style={{ background: "var(--soft)" }}>
                <p className="font-semibold">{hayFiltros || sec ? "No hay usados con esos filtros ahora." : "Pronto vamos a publicar los primeros usados."}</p>
                <p className="muted text-sm">¿Buscás algo puntual? <Link href="/asesor" className="link">Contale al asesor</Link> o <Link href="/usados/vender" className="link">ofrecenos el tuyo</Link>.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {usados.slice(0, 3).map((u) => <TarjetaUsado key={u.id} u={u} />)}
                {Promo}
                {usados.slice(3).map((u) => <TarjetaUsado key={u.id} u={u} />)}
              </div>
            )}
            {usados.length === 0 && <div className="max-w-xs">{Promo}</div>}
          </section>
        </div>

        <section className="grid gap-4 border-t pt-8 sm:grid-cols-3" style={{ borderColor: "var(--line)" }}>
          {[
            ["Revisados en taller", "Electrónica, calibración, trastes y limpieza. Te detallamos qué se hizo."],
            ["Garantía del taller", "El plazo figura en cada publicación."],
            ["Permuta", "Tomamos tu instrumento en parte de pago."],
          ].map(([t, d]) => (
            <div key={t} className="space-y-1">
              <p className="titulo text-lg">{t}</p>
              <p className="muted text-sm">{d}</p>
            </div>
          ))}
        </section>

        {vendidos.length > 0 && (
          <section className="space-y-3">
            <h2 className="titulo text-2xl">Vendidos recientemente</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{vendidos.map((u) => <TarjetaUsado key={u.id} u={u} />)}</div>
          </section>
        )}
      </main>
    </>
  );
}
