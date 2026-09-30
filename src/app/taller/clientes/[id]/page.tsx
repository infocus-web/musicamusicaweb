import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SERVICIOS, TIPOS_INSTRUMENTO, formatoFecha, linkSeguimiento, linkWhatsApp, siteUrl } from "@/lib/estados";
import { EstadoBadge } from "@/components/EstadoBadge";
import { CopiarLink } from "@/components/CopiarLink";
import { AccesoCliente } from "@/components/AccesoCliente";
import { actualizarCliente, crearInstrumento, crearTrabajo, regenerarLink } from "../../actions";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: c } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();

  const [{ data: instrumentos }, { data: trabajos }] = await Promise.all([
    supabase.from("instrumentos").select("*").eq("cliente_id", id).order("creado_en"),
    supabase.from("trabajos").select("id, numero, servicio, estado, fecha_ingreso, instrumento_id").eq("cliente_id", id).order("fecha_ingreso", { ascending: false }),
  ]);

  const url = linkSeguimiento(c.token);
  const mensaje = `Hola ${c.nombre}! Tu código de cliente en Música Música Web es ${c.codigo}. Podés seguir el avance de tus instrumentos acá: ${url}`;
  const nombreInstrumento = (iid: string | null) => {
    const i = instrumentos?.find((x) => x.id === iid);
    return i ? [i.tipo, i.marca, i.modelo].filter(Boolean).join(" · ") : "—";
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/taller/clientes" className="muted text-sm hover:underline">← Clientes</Link>
        <h1 className="text-2xl font-semibold">{c.nombre} <span className="font-mono text-base muted">{c.codigo}</span></h1>
      </div>

      <section className="card space-y-3">
        <h2 className="font-semibold">Link privado de seguimiento</h2>
        <p className="break-all font-mono text-sm">{url}</p>
        <div className="flex flex-wrap gap-2">
          <CopiarLink url={url} />
          <a className="btn" href={linkWhatsApp(c.telefono, mensaje)} target="_blank" rel="noreferrer">Enviar por WhatsApp</a>
          <a className="btn-ghost" href={url} target="_blank" rel="noreferrer">Ver como cliente</a>
          <form action={regenerarLink.bind(null, c.id)}>
            <button className="btn-ghost" title="El link anterior deja de funcionar">Generar link nuevo</button>
          </form>
        </div>
      </section>

      <AccesoCliente
        clienteId={c.id}
        codigo={c.codigo}
        nombre={c.nombre}
        telefono={c.telefono}
        tieneAcceso={!!c.user_id}
        urlCuenta={`${siteUrl()}/mi-cuenta`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-4">
          <h2 className="font-semibold">Trabajos</h2>
          <ul className="space-y-2">
            {(trabajos ?? []).map((t) => (
              <li key={t.id}>
                <Link href={`/taller/trabajos/${t.id}`} className="flex flex-wrap items-center gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--line)" }}>
                  <span className="font-mono font-semibold">{t.numero}</span>
                  <EstadoBadge estado={t.estado} />
                  <span className="muted">{t.servicio} · {nombreInstrumento(t.instrumento_id)} · {formatoFecha(t.fecha_ingreso)}</span>
                </Link>
              </li>
            ))}
            {(trabajos ?? []).length === 0 && <li className="muted text-sm">Sin trabajos todavía.</li>}
          </ul>

          <form action={crearTrabajo.bind(null, c.id)} className="space-y-3 border-t pt-4" style={{ borderColor: "var(--line)" }}>
            <h3 className="font-medium">Nuevo trabajo (orden)</h3>
            {(instrumentos ?? []).length === 0 ? (
              <p className="muted text-sm">Primero cargá un instrumento →</p>
            ) : (
              <>
                <label className="field"><span>Instrumento</span>
                  <select name="instrumento_id" required>
                    {instrumentos!.map((i) => <option key={i.id} value={i.id}>{nombreInstrumento(i.id)}{i.numero_serie ? ` (S/N ${i.numero_serie})` : ""}</option>)}
                  </select>
                </label>
                <label className="field"><span>Servicio</span>
                  <select name="servicio">{SERVICIOS.map((s) => <option key={s}>{s}</option>)}</select>
                </label>
                <label className="field"><span>Problema / pedido del cliente</span><textarea name="problema" rows={3} /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="field"><span>Presupuesto ($)</span><input name="presupuesto" inputMode="decimal" /></label>
                  <label className="field"><span>Fecha estimada</span><input name="fecha_estimada" type="date" /></label>
                </div>
                <button className="btn w-full">Crear orden de trabajo</button>
              </>
            )}
          </form>
        </section>

        <div className="space-y-6">
          <section className="card space-y-4">
            <h2 className="font-semibold">Instrumentos</h2>
            <ul className="space-y-1 text-sm">
              {(instrumentos ?? []).map((i) => (
                <li key={i.id}>
                  <b>{i.tipo}</b> {[i.marca, i.modelo].filter(Boolean).join(" ")}
                  {i.numero_serie && <span className="muted"> · S/N {i.numero_serie}</span>}
                  {i.notas && <span className="muted"> · {i.notas}</span>}
                </li>
              ))}
              {(instrumentos ?? []).length === 0 && <li className="muted">Sin instrumentos cargados.</li>}
            </ul>
            <form action={crearInstrumento.bind(null, c.id)} className="grid grid-cols-2 gap-3 border-t pt-4" style={{ borderColor: "var(--line)" }}>
              <label className="field col-span-2"><span>Tipo</span>
                <select name="tipo">{TIPOS_INSTRUMENTO.map((t) => <option key={t}>{t}</option>)}</select>
              </label>
              <label className="field"><span>Marca</span><input name="marca" /></label>
              <label className="field"><span>Modelo</span><input name="modelo" /></label>
              <label className="field"><span>N° de serie</span><input name="numero_serie" /></label>
              <label className="field"><span>Notas</span><input name="notas" /></label>
              <button className="btn-ghost col-span-2">Agregar instrumento</button>
            </form>
          </section>

          <form action={actualizarCliente.bind(null, c.id)} className="card space-y-3">
            <h2 className="font-semibold">Datos del cliente</h2>
            <label className="field"><span>Nombre</span><input name="nombre" defaultValue={c.nombre} required /></label>
            <label className="field"><span>Teléfono</span><input name="telefono" defaultValue={c.telefono ?? ""} /></label>
            <label className="field"><span>Email</span><input name="email" type="email" defaultValue={c.email ?? ""} /></label>
            <label className="field"><span>Notas</span><textarea name="notas" rows={2} defaultValue={c.notas ?? ""} /></label>
            <button className="btn-ghost">Guardar cambios</button>
          </form>
        </div>
      </div>
    </div>
  );
}
