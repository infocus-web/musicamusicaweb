import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACCESORIOS, ESTADOS, SERVICIOS, estadoInfo, formatoFecha, formatoFechaHora, formatoPesos, linkSeguimiento, appWhatsApp } from "@/lib/estados";
import { EstadoBadge } from "@/components/EstadoBadge";
import { SubirAvance } from "@/components/SubirAvance";
import { Media } from "@/components/Media";
import { BorrarAvance } from "@/components/BorrarAvance";
import { actualizarTrabajo, anularAprobacion, pedirAprobacion } from "../../actions";
import { crearCasoDesdeTrabajo } from "../../nuestros-clientes/actions";
import { BotonGuardar } from "@/components/BotonGuardar";

export default async function TrabajoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ recibido?: string }> }) {
  const { id } = await params;
  const { recibido } = await searchParams;
  const supabase = await createClient();
  const { data: t } = await supabase
    .from("trabajos")
    .select("*, clientes(id, nombre, codigo, telefono, token), instrumentos(tipo, marca, modelo, numero_serie)")
    .eq("id", id)
    .maybeSingle();
  if (!t) notFound();

  const { data: aprobaciones } = await supabase.from("aprobaciones").select("*").eq("trabajo_id", id).neq("estado", "anulada").order("creado_en", { ascending: false });
  const { data: avances } = await supabase.from("avances").select("*").eq("trabajo_id", id).order("creado_en", { ascending: false });
  const paths = (avances ?? []).map((a) => a.media_path).filter(Boolean) as string[];
  const firmadas = paths.length ? (await supabase.storage.from("avances").createSignedUrls(paths, 3600)).data ?? [] : [];
  const urlDe = (p: string | null) => firmadas.find((f) => f.path === p)?.signedUrl;

  const inst = t.instrumentos;
  const nombreInst = inst ? [inst.tipo, inst.marca, inst.modelo].filter(Boolean).join(" · ") : "Sin instrumento";
  const url = linkSeguimiento(t.clientes.token);
  const aviso = `Hola ${t.clientes.nombre}! Tu ${nombreInst} (orden ${t.numero}) está en estado: ${estadoInfo(t.estado).label}. Podés ver el avance acá: ${url}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/taller/clientes/${t.clientes.id}`} className="muted text-sm hover:underline">← {t.clientes.nombre} ({t.clientes.codigo})</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold">{t.numero}</h1>
          <EstadoBadge estado={t.estado} />
        </div>
        <p className="muted text-sm">
          {nombreInst}{inst?.numero_serie ? ` · S/N ${inst.numero_serie}` : ""} · ingresó {formatoFecha(t.fecha_ingreso)}
          {t.presupuesto != null && ` · presupuesto ${formatoPesos(t.presupuesto)}${t.presupuesto_aprobado ? " (aprobado)" : ""}`}
        </p>
      </div>

      {recibido && (
        <p role="status" className="rounded-xl p-3 text-sm" style={{ background: "#dcfce7", color: "#14532d" }}>
          <b>✓ Instrumento recibido.</b> Subí las fotos del estado en que llegó desde “Nuevo avance” (podés marcarlas como internas) y avisale al cliente por WhatsApp.
        </p>
      )}

      {(t.accesorios?.length > 0 || t.insumos) && (
        <section className="card grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <h2 className="mb-1 font-semibold">Accesorios que dejó</h2>
            {t.accesorios?.length ? <ul className="list-disc pl-5">{(t.accesorios as string[]).map((a) => <li key={a}>{a}</li>)}</ul> : <p className="muted">Ninguno</p>}
          </div>
          <div>
            <h2 className="mb-1 font-semibold">Insumos que requiere</h2>
            {t.insumos ? <ul className="list-disc pl-5">{(t.insumos as string).split("\n").filter(Boolean).map((l, i) => <li key={i}>{l}</li>)}</ul> : <p className="muted">Sin cargar</p>}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <a className="btn" href={appWhatsApp(t.clientes.telefono, aviso)}>Avisar por WhatsApp</a>
            <Link className="btn-ghost" href={`/taller/mensajes/${t.clientes.id}`}>Chat del cliente</Link>
            <a className="btn-ghost" href={url} target="_blank" rel="noreferrer">Ver como cliente</a>
            {["listo", "entregado"].includes(t.estado) && (
              <form action={crearCasoDesdeTrabajo.bind(null, t.id)}><button className="btn-ghost">Mostrar en Nuestros clientes</button></form>
            )}
          </div>

          <h2 className="font-semibold">Avances</h2>
          {(avances ?? []).length === 0 && <p className="muted text-sm">Sin avances.</p>}
          <ol className="space-y-3">
            {(avances ?? []).map((a) => {
              const mediaUrl = urlDe(a.media_path);
              return (
                <li key={a.id} className="card space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="muted">{formatoFechaHora(a.creado_en)}</span>
                    {a.estado && <EstadoBadge estado={a.estado} />}
                    {!a.visible_cliente && <span className="badge bg-zinc-200 text-zinc-700">Interno</span>}
                    <span className="ml-auto"><BorrarAvance id={a.id} trabajoId={t.id} /></span>
                  </div>
                  {a.descripcion && <p>{a.descripcion}</p>}
                  {!a.descripcion && a.estado && !a.media_path && <p className="muted text-sm">Cambio de estado a {estadoInfo(a.estado).label}.</p>}
                  {mediaUrl && <Media url={mediaUrl} tipo={a.media_tipo} />}
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="space-y-6">
          <section className="card space-y-3">
            <h2 className="font-semibold">Pedir aprobación al cliente</h2>
            <p className="muted text-xs">Le aparece en su panel con botones Aprobar / No aprobar. La orden pasa a “Esperando aprobación”.</p>
            {(aprobaciones ?? []).map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm" style={{ borderColor: "var(--line)" }}>
                <span className="flex-1">{a.tipo === "ampliacion" ? "Ampliación" : "Presupuesto"} · <b>{formatoPesos(a.monto)}</b>
                  {a.respuesta && <span className="muted block text-xs">“{a.respuesta}”</span>}</span>
                <span className={`badge ${a.estado === "aprobada" ? "bg-emerald-100 text-emerald-800" : a.estado === "rechazada" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{a.estado === "pendiente" ? "Esperando" : a.estado}</span>
                {a.estado === "pendiente" && <form action={anularAprobacion.bind(null, a.id, t.id)}><button className="muted text-xs hover:underline">Anular</button></form>}
              </div>
            ))}
            <form action={pedirAprobacion.bind(null, t.id)} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="field"><span>Qué pedís</span>
                  <select name="tipo" defaultValue={t.presupuesto_aprobado ? "ampliacion" : "presupuesto"}>
                    <option value="presupuesto">Presupuesto</option><option value="ampliacion">Ampliación</option>
                  </select>
                </label>
                <label className="field"><span>Monto ($)</span><input name="monto" inputMode="decimal" required defaultValue={t.presupuesto_aprobado ? "" : t.presupuesto ?? ""} /></label>
              </div>
              <label className="field"><span>Detalle para el cliente</span><textarea name="detalle" rows={2} placeholder="Ej.: hay que cambiar el jack y dos trastes" /></label>
              <BotonGuardar className="btn w-full">Enviar al cliente</BotonGuardar>
            </form>
          </section>

          <SubirAvance trabajoId={t.id} />

          <form action={actualizarTrabajo.bind(null, t.id)} className="card space-y-3">
            <h2 className="font-semibold">Estado y datos</h2>
            <label className="field"><span>Estado</span>
              <select name="estado" defaultValue={t.estado}>
                {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </label>
            <label className="field"><span>Servicio</span>
              <select name="servicio" defaultValue={t.servicio}>
                {[...new Set([t.servicio, ...SERVICIOS])].map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="field"><span>Problema / pedido</span><textarea name="problema" rows={3} defaultValue={t.problema ?? ""} /></label>
            <label className="field"><span>Insumos que requiere (uno por línea)</span><textarea name="insumos" rows={3} defaultValue={t.insumos ?? ""} /></label>
            <fieldset className="space-y-1.5 text-sm">
              <legend className="muted">Accesorios que dejó</legend>
              <div className="grid grid-cols-2 gap-1">
                {ACCESORIOS.map((a) => <label key={a} className="flex items-center gap-1.5"><input type="checkbox" name="accesorios" value={a} defaultChecked={(t.accesorios ?? []).includes(a)} /> {a}</label>)}
              </div>
              <input name="accesorios_otros" defaultValue={((t.accesorios ?? []) as string[]).filter((a) => !ACCESORIOS.includes(a)).join(", ")} placeholder="Otros, separados por coma"
                className="w-full rounded-xl border px-3 py-2" style={{ borderColor: "var(--line)", background: "var(--bg)" }} />
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <label className="field"><span>Presupuesto ($)</span><input name="presupuesto" inputMode="decimal" defaultValue={t.presupuesto ?? ""} /></label>
              <label className="field"><span>Fecha estimada</span><input name="fecha_estimada" type="date" defaultValue={t.fecha_estimada ?? ""} /></label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="presupuesto_aprobado" defaultChecked={t.presupuesto_aprobado} /> Presupuesto aprobado por el cliente
            </label>
            <label className="field"><span>Notas internas (el cliente no las ve)</span><textarea name="notas_internas" rows={3} defaultValue={t.notas_internas ?? ""} /></label>
            <BotonGuardar className="btn w-full" />
          </form>
        </aside>
      </div>
    </div>
  );
}
