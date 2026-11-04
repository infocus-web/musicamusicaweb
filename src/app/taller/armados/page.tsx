import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatoFechaHora, formatoPesos } from "@/lib/estados";
import { ESTADOS_ARMADO } from "@/lib/armados";

const FILTROS = [
  { id: "enviado", label: "Para presupuestar" },
  { id: "presupuestado", label: "Esperando respuesta" },
  { id: "aprobado", label: "Aprobados" },
  { id: "borrador", label: "Armando" },
  { id: "todos", label: "Todos" },
];

type Fila = { id: string; nombre: string; tipo: string | null; estado: string; presupuesto: number | null; actualizado_en: string; clientes: { nombre: string; codigo: string } | null; armado_partes: { count: number }[] };

/** "Armá tu instrumento": lo que arman los clientes desde su panel, para presupuestarlo. */
export default async function ArmadosPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver = "enviado" } = await searchParams;
  const filtro = FILTROS.some((f) => f.id === ver) ? ver : "enviado";
  const supabase = await createClient();
  let q = supabase.from("armados").select("id, nombre, tipo, estado, presupuesto, actualizado_en, clientes(nombre, codigo), armado_partes(count)")
    .order("actualizado_en", { ascending: false }).limit(300);
  q = filtro === "todos" ? q.neq("estado", "cancelado") : q.eq("estado", filtro);
  const [{ data }, { count: nEnviados }] = await Promise.all([
    q,
    supabase.from("armados").select("id", { count: "exact", head: true }).eq("estado", "enviado"),
  ]);
  const filas = (data ?? []) as unknown as Fila[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Armá tu instrumento</h1>
        <p className="muted text-sm">Instrumentos que los clientes arman parte por parte desde su panel. Cuando piden presupuesto, aparecen en “Para presupuestar”.</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {FILTROS.map((f) => (
          <Link key={f.id} href={`/taller/armados?ver=${f.id}`} className={filtro === f.id ? "btn !py-1.5" : "btn-ghost !py-1.5"} aria-current={filtro === f.id ? "page" : undefined}>
            {f.label}{f.id === "enviado" && (nEnviados ?? 0) > 0 ? <span className="badge bg-white text-red-700">{nEnviados}</span> : null}
          </Link>
        ))}
      </div>
      <div className="card divide-y !p-0">
        {filas.length === 0 && <p className="muted p-4 text-sm">No hay armados en esta lista.</p>}
        {filas.map((a) => {
          const e = ESTADOS_ARMADO[a.estado] ?? ESTADOS_ARMADO.borrador;
          const n = a.armado_partes?.[0]?.count ?? 0;
          return (
            <Link key={a.id} href={`/taller/armados/${a.id}`} className="flex flex-wrap items-center gap-3 p-4 hover:bg-[var(--soft)]" style={{ borderColor: "var(--line)" }}>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.nombre} <span className={`badge ${e.clase}`}>{e.label}</span></p>
                <p className="muted text-sm">{a.clientes?.nombre} <span className="font-mono text-xs">{a.clientes?.codigo}</span> · {[a.tipo, `${n} parte${n === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}</p>
                <p className="muted text-xs">{formatoFechaHora(a.actualizado_en)}</p>
              </div>
              {a.presupuesto != null && <b>{formatoPesos(Number(a.presupuesto))}</b>}
              <span className="btn-ghost !py-1.5 text-sm">{a.estado === "enviado" ? "Presupuestar" : "Ver"}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
