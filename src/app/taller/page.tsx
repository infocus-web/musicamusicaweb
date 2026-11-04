import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS, ESTADOS_ACTIVOS, formatoFecha } from "@/lib/estados";
import { EstadoBadge } from "@/components/EstadoBadge";
import { ResumenHoy, type Atrasado, type Listo } from "./ResumenHoy";

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

  // Resumen del día
  const n = (r: { count: number | null }) => r.count ?? 0;
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
  const diasDesde = (d: string | null) => (d ? Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000)) : null);
  const [{ data: avisosData }, turnosHoy, turnosPedidos, { data: atrasadosData }] = await Promise.all([
    supabase.from("avisos").select("cliente_id").is("enviado_en", null).eq("descartado", false).limit(1000),
    supabase.from("turnos").select("id", { count: "exact", head: true }).eq("estado", "confirmado").eq("fecha", hoy),
    supabase.from("turnos").select("id", { count: "exact", head: true }).eq("estado", "pedido"),
    supabase.from("trabajos").select("id, numero, fecha_estimada, clientes(nombre), instrumentos(tipo, marca, modelo)")
      .in("estado", ESTADOS_ACTIVOS.filter((e) => e !== "listo")).lt("fecha_estimada", hoy).order("fecha_estimada").limit(30),
  ]);
  type FilaAtr = { id: string; numero: string; fecha_estimada: string; clientes: { nombre: string } | null; instrumentos: { tipo: string; marca: string | null; modelo: string | null } | null };
  const atrasados: Atrasado[] = ((atrasadosData ?? []) as unknown as FilaAtr[]).map((a) => ({
    id: a.id, numero: a.numero, estimada: a.fecha_estimada, cliente: a.clientes?.nombre ?? "",
    instrumento: [a.instrumentos?.tipo, a.instrumentos?.marca, a.instrumentos?.modelo].filter(Boolean).join(" ") || "instrumento",
    dias: diasDesde(a.fecha_estimada + "T12:00:00-03:00") ?? 0,
  }));
  const [enTaller, pedidos, tasaciones, arrep, chat, { data: listosData }] = await Promise.all([
    supabase.from("trabajos").select("id", { count: "exact", head: true }).in("estado", ESTADOS_ACTIVOS),
    supabase.from("pedidos").select("id", { count: "exact", head: true }).in("estado", ["pendiente", "a_cotizar", "pagado"]),
    supabase.from("tasaciones").select("id", { count: "exact", head: true }).eq("estado", "nueva"),
    supabase.from("arrepentimientos").select("id", { count: "exact", head: true }).eq("estado", "recibido"),
    supabase.from("mensajes").select("id", { count: "exact", head: true }).eq("autor", "cliente").eq("leido_taller", false),
    supabase.from("trabajos").select("id, numero, listo_en, actualizado_en, clientes(nombre, telefono, token), instrumentos(tipo, marca, modelo)").eq("estado", "listo").order("actualizado_en").limit(30),
  ]);
  type FilaListo = { id: string; numero: string; listo_en: string | null; actualizado_en: string; clientes: { nombre: string; telefono: string | null; token: string } | null; instrumentos: { tipo: string; marca: string | null; modelo: string | null } | null };
  const listos: Listo[] = ((listosData ?? []) as unknown as FilaListo[]).map((l) => ({
    id: l.id, numero: l.numero,
    instrumento: [l.instrumentos?.tipo, l.instrumentos?.marca, l.instrumentos?.modelo].filter(Boolean).join(" ") || "instrumento",
    cliente: l.clientes?.nombre ?? "", telefono: l.clientes?.telefono ?? null, token: l.clientes?.token ?? "",
    dias: diasDesde(l.listo_en ?? l.actualizado_en),
  }));

  return (
    <div className="space-y-6">
      <ResumenHoy cifras={{ enTaller: n(enTaller), listos: listos.length, pedidos: n(pedidos), consultas: n(tasaciones) + n(arrep), chat: n(chat), avisos: new Set((avisosData ?? []).map((a) => a.cliente_id)).size, turnosHoy: n(turnosHoy), turnosPedidos: n(turnosPedidos) }} listos={listos} atrasados={atrasados} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h2 id="tablero" className="scroll-mt-20 text-xl font-semibold">Trabajos en el taller</h2>
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
