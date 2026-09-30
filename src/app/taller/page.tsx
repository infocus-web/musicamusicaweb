import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS, ESTADOS_ACTIVOS, formatoFecha } from "@/lib/estados";
import { EstadoBadge } from "@/components/EstadoBadge";

type Fila = {
  id: string; numero: string; servicio: string; estado: string; fecha_ingreso: string; fecha_estimada: string | null;
  clientes: { nombre: string; codigo: string } | null;
  instrumentos: { tipo: string; marca: string | null; modelo: string | null } | null;
};

export default async function TableroPage({ searchParams }: { searchParams: Promise<{ q?: string; todos?: string }> }) {
  const { q, todos } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("trabajos")
    .select("id, numero, servicio, estado, fecha_ingreso, fecha_estimada, clientes(nombre, codigo), instrumentos(tipo, marca, modelo)")
    .order("fecha_ingreso", { ascending: false })
    .limit(300);
  if (!todos) query = query.in("estado", ESTADOS_ACTIVOS);
  if (q) query = query.ilike("numero", `%${q}%`);
  const { data } = await query;
  const trabajos = (data ?? []) as unknown as Fila[];

  const columnas = ESTADOS.filter((e) => todos || ESTADOS_ACTIVOS.includes(e.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold">Trabajos en el taller</h1>
          <p className="muted text-sm">{trabajos.length} trabajo(s){todos ? "" : " en curso"}</p>
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Buscar OT-…" className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--card)" }} />
          {todos && <input type="hidden" name="todos" value="1" />}
          <button className="btn-ghost">Buscar</button>
        </form>
        <Link href={todos ? "/taller" : "/taller?todos=1"} className="btn-ghost">
          {todos ? "Solo en curso" : "Ver todos"}
        </Link>
        <Link href="/taller/clientes" className="btn">+ Nuevo ingreso</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {columnas.map((col) => {
          const items = trabajos.filter((t) => t.estado === col.id);
          return (
            <section key={col.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <EstadoBadge estado={col.id} />
                <span className="muted text-sm">{items.length}</span>
              </div>
              {items.length === 0 && <p className="muted text-sm">Nada por acá.</p>}
              <ul className="space-y-2">
                {items.map((t) => (
                  <li key={t.id}>
                    <Link href={`/taller/trabajos/${t.id}`} className="block rounded-xl border p-3 hover:shadow-sm" style={{ borderColor: "var(--line)" }}>
                      <div className="flex justify-between text-sm">
                        <span className="font-mono font-semibold">{t.numero}</span>
                        <span className="muted">{formatoFecha(t.fecha_ingreso)}</span>
                      </div>
                      <div className="text-sm">
                        {[t.instrumentos?.tipo, t.instrumentos?.marca, t.instrumentos?.modelo].filter(Boolean).join(" · ") || "Sin instrumento"}
                      </div>
                      <div className="muted text-xs">
                        {t.servicio} — {t.clientes?.nombre} ({t.clientes?.codigo})
                        {t.fecha_estimada ? ` · estimado ${formatoFecha(t.fecha_estimada)}` : ""}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
