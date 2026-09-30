/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatoFechaHora, linkWhatsApp } from "@/lib/estados";
import { categoriaLabel, condicionInfo } from "@/lib/usados";
import { estadoArrepentimiento, estadoTasacion, notaTasacion } from "./actions";

const PESTANAS = [
  { id: "usado", label: "Tasaciones de usados" },
  { id: "presupuesto", label: "Mejorar presupuesto" },
  { id: "arrepentimiento", label: "Arrepentimiento" },
  { id: "asesor", label: "Asesor" },
];
const QUIERE: Record<string, string> = { vender: "Vender", permutar: "Permuta", consignar: "Consignación" };

export default async function ConsultasPage({ searchParams }: { searchParams: Promise<{ tab?: string; ver?: string }> }) {
  const { tab = "usado", ver } = await searchParams;
  const supabase = await createClient();

  const conteo = async (tipo: string) =>
    (await supabase.from("tasaciones").select("id", { count: "exact", head: true }).eq("tipo", tipo).eq("estado", "nueva")).count ?? 0;
  const [nUsado, nPres, nArr] = await Promise.all([
    conteo("usado"), conteo("presupuesto"),
    supabase.from("arrepentimientos").select("id", { count: "exact", head: true }).eq("estado", "recibido").then((r) => r.count ?? 0),
  ]);
  const badges: Record<string, number> = { usado: nUsado, presupuesto: nPres, arrepentimiento: nArr };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Consultas de la web</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        {PESTANAS.map((p) => (
          <Link key={p.id} href={`/taller/consultas?tab=${p.id}`} className={tab === p.id ? "btn !py-1.5" : "btn-ghost !py-1.5"}>
            {p.label}{badges[p.id] ? <span className="badge bg-white text-red-700">{badges[p.id]}</span> : null}
          </Link>
        ))}
      </div>

      {(tab === "usado" || tab === "presupuesto") && <Tasaciones tipo={tab} ver={ver} />}
      {tab === "arrepentimiento" && <Arrepentimientos />}
      {tab === "asesor" && <Asesor />}
    </div>
  );
}

async function Tasaciones({ tipo, ver }: { tipo: string; ver?: string }) {
  const supabase = await createClient();
  let q = supabase.from("tasaciones").select("*").eq("tipo", tipo).order("creado_en", { ascending: false }).limit(200);
  q = ver === "todas" ? q : q.neq("estado", "cerrada");
  const { data } = await q;
  const filas = data ?? [];
  const paths = filas.flatMap((t) => t.fotos as string[]);
  const firmadas = paths.length ? (await supabase.storage.from("tasaciones").createSignedUrls(paths, 3600)).data ?? [] : [];
  const url = (p: string) => firmadas.find((f) => f.path === p)?.signedUrl ?? undefined;

  return (
    <div className="space-y-3">
      <Link href={`/taller/consultas?tab=${tipo}${ver === "todas" ? "" : "&ver=todas"}`} className="link text-sm">
        {ver === "todas" ? "Ocultar cerradas" : "Ver también las cerradas"}
      </Link>
      {filas.length === 0 && <p className="card muted">No hay pedidos pendientes.</p>}
      {filas.map((t) => {
        const msg = tipo === "presupuesto"
          ? `Hola ${t.nombre}! Te escribimos de Música Música Web por el presupuesto que nos mandaste (${[t.marca, t.modelo].filter(Boolean).join(" ")}).`
          : `Hola ${t.nombre}! Te escribimos de Música Música Web por tu ${[t.marca, t.modelo].filter(Boolean).join(" ")}.`;
        return (
          <article key={t.id} className="card space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-auto font-semibold">
                {[t.marca, t.modelo].filter(Boolean).join(" ") || "Sin datos"}
                {t.categoria && <span className="muted font-normal"> · {categoriaLabel(t.categoria)}</span>}
              </h2>
              {tipo === "usado" && <span className="badge bg-zinc-200 text-zinc-800">{QUIERE[t.quiere] ?? t.quiere}</span>}
              <span className={`badge ${t.estado === "nueva" ? "bg-red-100 text-red-700" : t.estado === "contactado" ? "bg-amber-100 text-amber-800" : "bg-zinc-200 text-zinc-700"}`}>{t.estado}</span>
              <span className="muted text-xs">{formatoFechaHora(t.creado_en)}</span>
            </div>
            <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="muted">Cliente</dt><dd>{t.nombre} · {t.telefono}{t.email ? ` · ${t.email}` : ""}</dd>
              {t.anio && <><dt className="muted">Año</dt><dd>{t.anio}</dd></>}
              {t.condicion && tipo === "usado" && <><dt className="muted">Estado</dt><dd>{condicionInfo(t.condicion).label}</dd></>}
              {t.precio_pretendido && <><dt className="muted">{tipo === "presupuesto" ? "Precio que le pasaron" : "Pretende"}</dt><dd>{t.precio_pretendido}</dd></>}
              {t.interes && <><dt className="muted">{tipo === "presupuesto" ? "Dónde" : "Le interesa"}</dt><dd>{t.interes}</dd></>}
              {t.descripcion && <><dt className="muted">Detalle</dt><dd className="whitespace-pre-line">{t.descripcion}</dd></>}
            </dl>
            {(t.fotos as string[]).length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {(t.fotos as string[]).map((p) => url(p) && (
                  <a key={p} href={url(p)} target="_blank" rel="noreferrer"><img src={url(p)} alt="" className="h-28 w-28 rounded-lg object-cover" /></a>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <a href={linkWhatsApp(t.telefono, msg)} target="_blank" rel="noreferrer" className="btn">Responder por WhatsApp</a>
              {["nueva", "contactado", "cerrada"].filter((e) => e !== t.estado).map((e) => (
                <form key={e} action={estadoTasacion.bind(null, t.id, e)}><button className="btn-ghost !py-1.5 text-sm">Marcar {e}</button></form>
              ))}
              {tipo === "usado" && <Link href="/taller/usados" className="link text-sm">Publicarlo en usados</Link>}
            </div>
            <form action={notaTasacion.bind(null, t.id)} className="flex gap-2">
              <input name="nota" defaultValue={t.notas_internas ?? ""} placeholder="Nota interna (tasación ofrecida, etc.)" className="flex-1 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--bg)" }} />
              <button className="btn-ghost !py-1.5 text-sm">Guardar</button>
            </form>
          </article>
        );
      })}
    </div>
  );
}

async function Arrepentimientos() {
  const supabase = await createClient();
  const { data } = await supabase.from("arrepentimientos").select("*").order("creado_en", { ascending: false }).limit(200);
  return (
    <div className="space-y-3">
      <p className="muted text-sm">La ley pide responder dentro de las 24 h con el código de trámite (el cliente ya lo vio en pantalla).</p>
      {(data ?? []).length === 0 && <p className="card muted">No hay pedidos.</p>}
      {(data ?? []).map((a) => (
        <article key={a.id} className="card space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-semibold">{a.codigo}</span>
            <span className="mr-auto">{a.nombre}</span>
            <span className="badge bg-zinc-200 text-zinc-800">{a.estado}</span>
            <span className="muted text-xs">{formatoFechaHora(a.creado_en)}</span>
          </div>
          <p>{[a.telefono, a.email].filter(Boolean).join(" · ")}</p>
          {a.referencia && <p><span className="muted">Compra/servicio: </span>{a.referencia}</p>}
          {a.detalle && <p className="whitespace-pre-line">{a.detalle}</p>}
          <div className="flex flex-wrap gap-2">
            {a.telefono && <a className="btn !py-1.5" target="_blank" rel="noreferrer" href={linkWhatsApp(a.telefono, `Hola ${a.nombre}, recibimos tu pedido de arrepentimiento ${a.codigo}.`)}>WhatsApp</a>}
            {["recibido", "en_proceso", "resuelto"].filter((e) => e !== a.estado).map((e) => (
              <form key={e} action={estadoArrepentimiento.bind(null, a.id, e)}><button className="btn-ghost !py-1.5">Marcar {e.replace("_", " ")}</button></form>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

async function Asesor() {
  const supabase = await createClient();
  const { data } = await supabase.from("asesor_consultas").select("objetivo, respuestas, creado_en").order("creado_en", { ascending: false }).limit(500);
  const filas = data ?? [];
  const cuenta = (f: (r: Record<string, string>) => string | undefined) => {
    const m = new Map<string, number>();
    filas.forEach((x) => { const v = f({ objetivo: x.objetivo ?? "", ...(x.respuestas as Record<string, string>) }); if (v) m.set(v, (m.get(v) ?? 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const bloques = [
    ["Qué quieren hacer", cuenta((r) => r.objetivo)],
    ["Instrumento", cuenta((r) => r.instrumento)],
    ["Presupuesto", cuenta((r) => r.presupuesto)],
    ["Nivel", cuenta((r) => r.nivel)],
  ] as const;
  return (
    <div className="space-y-3">
      <p className="muted text-sm">{filas.length} personas usaron el asesor (últimas 500).</p>
      <div className="grid gap-3 md:grid-cols-2">
        {bloques.map(([t, items]) => (
          <section key={t} className="card space-y-2">
            <h2 className="font-semibold">{t}</h2>
            {items.length === 0 && <p className="muted text-sm">Sin datos todavía.</p>}
            <ul className="space-y-1 text-sm">
              {items.map(([k, n]) => (
                <li key={k} className="flex items-center gap-2">
                  <span className="w-40 truncate">{k}</span>
                  <span className="h-2 rounded-full" style={{ width: `${Math.max(4, (n / filas.length) * 100)}%`, background: "var(--accent)" }} />
                  <span className="muted">{n}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
