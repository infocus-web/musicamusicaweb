import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { appWhatsApp } from "@/lib/estados";
import { BotonGuardar } from "@/components/BotonGuardar";
import { confirmarTurno, estadoTurno, nuevoTurno } from "./actions";

type Turno = { id: string; fecha: string; hora: string | null; franja: string | null; modo: string | null; motivo: string | null; estado: string; clientes: { id: string; nombre: string; codigo: string; telefono: string | null } | null };
const hoyAR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
const dia = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

export default async function TurnosPage() {
  const supabase = await createClient();
  const hoy = hoyAR();
  const [{ data: pedidos }, { data: proximos }, { data: clientes }] = await Promise.all([
    supabase.from("turnos").select("*, clientes(id, nombre, codigo, telefono)").eq("estado", "pedido").order("fecha"),
    supabase.from("turnos").select("*, clientes(id, nombre, codigo, telefono)").eq("estado", "confirmado").gte("fecha", hoy).order("fecha").order("hora").limit(200),
    supabase.from("clientes").select("id, nombre, codigo").order("nombre").limit(2000),
  ]);
  const porDia = new Map<string, Turno[]>();
  for (const t of (proximos ?? []) as Turno[]) porDia.set(t.fecha, [...(porDia.get(t.fecha) ?? []), t]);
  const campo = "rounded-lg border px-2 py-1.5 text-sm";
  const est = { borderColor: "var(--line)", background: "var(--bg)" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Turnos</h1>
        <p className="muted text-sm">Los clientes piden turno desde su panel. Confirmalo con día y hora: le llega al chat y queda listo el aviso de WhatsApp.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Pedidos para confirmar {(pedidos ?? []).length > 0 && <span className="badge ml-1 bg-red-100 text-red-700">{pedidos!.length}</span>}</h2>
        {(pedidos ?? []).length === 0 && <p className="card muted text-sm">No hay pedidos de turno pendientes.</p>}
        <div className="grid gap-3 lg:grid-cols-2">
          {((pedidos ?? []) as Turno[]).map((t) => (
            <article key={t.id} className="card space-y-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <Link href={`/taller/clientes/${t.clientes?.id}`} className="font-semibold hover:underline">{t.clientes?.nombre}</Link>
                <span className="muted font-mono text-xs">{t.clientes?.codigo}</span>
              </div>
              <p className="text-sm">Pidió: <b className="capitalize">{dia(t.fecha)}</b>{t.franja ? ` · ${t.franja}` : ""}{t.modo ? ` · ${t.modo}` : ""}</p>
              {t.motivo && <p className="muted text-sm">“{t.motivo}”</p>}
              <form action={confirmarTurno.bind(null, t.id)} className="flex flex-wrap items-end gap-2">
                <label className="field"><span>Día</span><input type="date" name="fecha" defaultValue={t.fecha} min={hoy} required className={campo} style={est} /></label>
                <label className="field"><span>Hora</span><input type="time" name="hora" required defaultValue={t.franja?.includes("mañana") ? "10:00" : "17:00"} className={campo} style={est} /></label>
                <BotonGuardar className="btn !py-1.5">Confirmar</BotonGuardar>
              </form>
              <div className="flex gap-3 text-sm">
                {t.clientes?.telefono && <a href={appWhatsApp(t.clientes.telefono, `Hola ${t.clientes.nombre.split(" ")[0]}! Te escribimos por el turno que pediste. `)} className="link">WhatsApp</a>}
                <form action={estadoTurno.bind(null, t.id, "cancelado")}><button className="muted hover:underline">Rechazar</button></form>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Agenda</h2>
          {porDia.size === 0 && <p className="card muted text-sm">No hay turnos confirmados próximos.</p>}
          {[...porDia].map(([fecha, ts]) => (
            <div key={fecha} className="card space-y-2">
              <h3 className="font-semibold capitalize">{fecha === hoy ? "Hoy · " : ""}{dia(fecha)}</h3>
              <ul className="divide-y text-sm">
                {ts.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-3 py-2" style={{ borderColor: "var(--line)" }}>
                    <b className="w-14 font-mono">{t.hora ?? "—"}</b>
                    <span className="flex-1"><Link href={`/taller/clientes/${t.clientes?.id}`} className="hover:underline">{t.clientes?.nombre}</Link>{t.modo ? <span className="muted"> · {t.modo}</span> : null}{t.motivo ? <span className="muted"> · {t.motivo}</span> : null}</span>
                    {fecha === hoy && <Link href={`/taller/recibir?cliente=${t.clientes?.id}`} className="btn !px-3 !py-1 text-xs">Recibir</Link>}
                    <form action={estadoTurno.bind(null, t.id, "realizado")}><button className="link text-xs">Vino ✓</button></form>
                    <form action={estadoTurno.bind(null, t.id, "cancelado")}><button className="muted text-xs hover:underline">Cancelar</button></form>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        <form action={nuevoTurno} className="card h-fit space-y-3">
          <h2 className="font-semibold">Agendar un turno</h2>
          <label className="field"><span>Cliente</span>
            <select name="cliente" required defaultValue=""><option value="" disabled>Elegí…</option>{(clientes ?? []).map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.codigo})</option>)}</select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="field"><span>Día</span><input type="date" name="fecha" min={hoy} required /></label>
            <label className="field"><span>Hora</span><input type="time" name="hora" required /></label>
          </div>
          <label className="field"><span>Cómo</span><select name="modo"><option>Lo trae al taller</option><option>Retiro a domicilio</option><option>Entrega a domicilio</option><option>Lo manda por correo</option></select></label>
          <label className="field"><span>Motivo</span><input name="motivo" placeholder="Calibración, retiro…" /></label>
          <BotonGuardar className="btn w-full">Agendar</BotonGuardar>
          <p className="muted text-xs">¿El cliente no está cargado? Primero crealo en <Link href="/taller/clientes" className="link">Clientes</Link>.</p>
        </form>
      </div>
    </div>
  );
}
