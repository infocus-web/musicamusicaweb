import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS, SERVICIOS, estadoInfo, formatoFecha, formatoFechaHora, formatoPesos, linkSeguimiento, linkWhatsApp } from "@/lib/estados";
import { EstadoBadge } from "@/components/EstadoBadge";
import { SubirAvance } from "@/components/SubirAvance";
import { Media } from "@/components/Media";
import { BorrarAvance } from "@/components/BorrarAvance";
import { actualizarTrabajo } from "../../actions";

export default async function TrabajoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: t } = await supabase
    .from("trabajos")
    .select("*, clientes(id, nombre, codigo, telefono, token), instrumentos(tipo, marca, modelo, numero_serie)")
    .eq("id", id)
    .maybeSingle();
  if (!t) notFound();

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

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <a className="btn" href={linkWhatsApp(t.clientes.telefono, aviso)} target="_blank" rel="noreferrer">Avisar por WhatsApp</a>
            <a className="btn-ghost" href={url} target="_blank" rel="noreferrer">Ver como cliente</a>
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
            <div className="grid grid-cols-2 gap-3">
              <label className="field"><span>Presupuesto ($)</span><input name="presupuesto" inputMode="decimal" defaultValue={t.presupuesto ?? ""} /></label>
              <label className="field"><span>Fecha estimada</span><input name="fecha_estimada" type="date" defaultValue={t.fecha_estimada ?? ""} /></label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="presupuesto_aprobado" defaultChecked={t.presupuesto_aprobado} /> Presupuesto aprobado por el cliente
            </label>
            <label className="field"><span>Notas internas (el cliente no las ve)</span><textarea name="notas_internas" rows={3} defaultValue={t.notas_internas ?? ""} /></label>
            <button className="btn w-full">Guardar</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
