/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_USADO, SECCIONES, estadoUsadoInfo, fotoUsado, formatoPrecio, seccionInfo, type Usado } from "@/lib/usados";
import { crearUsado } from "./actions";

export default async function UsadosTallerPage({ searchParams }: { searchParams: Promise<{ estado?: string; seccion?: string }> }) {
  const { estado, seccion } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("usados").select("*").order("actualizado_en", { ascending: false }).limit(300);
  if (estado) q = q.eq("estado", estado);
  if (seccion) q = q.eq("seccion", seccion);
  const { data } = await q;
  const usados = (data ?? []) as Usado[];

  const link = (p: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(Object.entries({ estado, seccion, ...p }).filter(([, v]) => v) as [string, string][]);
    return `/taller/usados${sp.size ? `?${sp}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold">Usados y liquidación</h1>
          <p className="muted text-sm">Lo que publiques aparece en <Link href="/usados" className="link" target="_blank">/usados</Link>.</p>
        </div>
        <Link href="/taller/consultas" className="btn-ghost">Tasaciones y consultas</Link>
        <form action={crearUsado} className="flex gap-2">
          <select name="seccion" className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
            {SECCIONES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button className="btn">+ Cargar</button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={link({ estado: undefined })} className={!estado ? "btn !py-1" : "btn-ghost !py-1"}>Todos</Link>
        {ESTADOS_USADO.map((e) => <Link key={e.id} href={link({ estado: e.id })} className={estado === e.id ? "btn !py-1" : "btn-ghost !py-1"}>{e.label}</Link>)}
        <span className="mx-2 muted">|</span>
        <Link href={link({ seccion: undefined })} className={!seccion ? "btn !py-1" : "btn-ghost !py-1"}>Todas las secciones</Link>
        {SECCIONES.map((s) => <Link key={s.id} href={link({ seccion: s.id })} className={seccion === s.id ? "btn !py-1" : "btn-ghost !py-1"}>{s.label}</Link>)}
      </div>

      {usados.length === 0 && <p className="card muted">No hay nada cargado con ese filtro.</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {usados.map((u) => {
          const e = estadoUsadoInfo(u.estado);
          const foto = fotoUsado(u.fotos[0]);
          return (
            <li key={u.id}>
              <Link href={`/taller/usados/${u.id}`} className="card flex gap-3 !p-3 hover:shadow-sm">
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--line)" }}>
                  {foto && <img src={foto} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1 text-xs">
                    <span className="font-mono">{u.codigo}</span>
                    <span className={`badge ${e.color}`}>{e.label}</span>
                    <span className={`badge ${seccionInfo(u.seccion).clase}`}>{seccionInfo(u.seccion).label}</span>
                    {u.destacado && <span className="badge bg-zinc-200 text-zinc-700">Destacado</span>}
                  </div>
                  <p className="truncate font-medium">{u.titulo}</p>
                  <p className="text-sm">{formatoPrecio(u.precio, u.moneda)} <span className="muted">· {u.fotos.length} foto(s)</span></p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
