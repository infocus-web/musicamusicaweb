"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  crearArmado, guardarDatosArmado, guardarParte, borrarParte, borrarArmado, pedirPresupuestoArmado, responderArmado,
} from "@/app/mi-cuenta/panel/armados";
import { ESTADOS_ARMADO, TIPOS_ARMADO, partesSugeridas } from "@/lib/armados";

export type ParteUI = { id: string; parte: string; nombre: string; modelo: string | null; link: string | null; notas: string | null; precio: number | null };
export type ArmadoUI = {
  id: string; nombre: string; tipo: string | null; notas: string | null; estado: string;
  presupuesto: number | null; detalle_presupuesto: string | null; actualizado_en: string; partes: ParteUI[];
};

const pesos = (n: number | null) => n == null ? "—" : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
const fecha = (d: string) => new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "America/Argentina/Buenos_Aires" });
const EDITABLES = ["borrador", "enviado", "presupuestado"];
const AVISO_CAMBIO = "Si cambiás algo, el presupuesto deja de valer y vas a tener que pedirlo de nuevo. ¿Seguimos?";
type R = { ok?: boolean; error?: string; id?: string } | undefined;

/** Envía el form sin que React lo vacíe: si hay un error, lo escrito no se pierde. */
function useEnviar(fn: (fd: FormData) => Promise<R>) {
  const [estado, setEstado] = useState<R>(undefined);
  const [pendiente, start] = useTransition();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => { const r = await fn(fd); if (r) setEstado(r); });
  };
  return { estado, pendiente, onSubmit };
}

function Estado({ estado }: { estado: string }) {
  const e = ESTADOS_ARMADO[estado] ?? ESTADOS_ARMADO.borrador;
  return <span className={`badge ${e.clase}`}>{e.label}</span>;
}

/** "Armá tu instrumento": lista de armados del cliente y el editor de cada uno. Cada cambio se guarda al toque. */
export function ArmaTuInstrumento({ token, armados }: { token: string | null; armados: ArmadoUI[] }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  const actual = armados.find((a) => a.id === abierto);
  if (actual) return <Editor token={token} a={actual} volver={() => setAbierto(null)} />;

  return (
    <div className="space-y-5">
      <section className="card space-y-2" style={{ borderColor: "var(--accent)" }}>
        <h2 className="text-lg font-semibold">🛠️ Armá tu instrumento</h2>
        <p className="text-sm">Elegí parte por parte cómo querés tu instrumento: cuerpo, mástil, pastillas, hardware… Poné la marca, el modelo y, si lo tenés, el link del producto. Se guarda solo, así que podés ir armándolo de a poco.</p>
        <p className="muted text-sm">Cuando esté listo, tocá <b>“Pedir presupuesto”</b> y te pasamos el valor acá mismo.</p>
      </section>

      <NuevoArmado token={token} alCrear={setAbierto} />

      {armados.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Tus armados</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {armados.map((a) => (
              <button key={a.id} type="button" onClick={() => setAbierto(a.id)}
                className="card space-y-2 !p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{a.nombre}</p>
                  <Estado estado={a.estado} />
                </div>
                <p className="muted text-xs">{[a.tipo, `${a.partes.length} parte${a.partes.length === 1 ? "" : "s"}`, `actualizado ${fecha(a.actualizado_en)}`].filter(Boolean).join(" · ")}</p>
                {a.estado === "presupuestado" && <p className="font-semibold" style={{ color: "var(--accent)" }}>Presupuesto: {pesos(a.presupuesto)} — tocá para ver</p>}
                {a.estado === "borrador" && <p className="link text-sm">Seguir armando →</p>}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function NuevoArmado({ token, alCrear }: { token: string | null; alCrear: (id: string) => void }) {
  const router = useRouter();
  const { estado, pendiente, onSubmit } = useEnviar(async (fd) => {
    const r = await crearArmado(token, undefined, fd);
    if (r.ok && r.id) { router.refresh(); alCrear(r.id); }
    return r;
  });
  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <h2 className="font-semibold">Empezar un armado nuevo</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field"><span>Nombre</span><input name="nombre" required maxLength={120} placeholder="Ej.: Mi Strato custom" /></label>
        <label className="field"><span>Qué instrumento</span>
          <select name="tipo" defaultValue="Guitarra eléctrica">{TIPOS_ARMADO.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
      </div>
      {estado?.error && <p role="alert" className="text-sm text-red-600">{estado.error}</p>}
      <button className="btn w-full sm:w-auto" disabled={pendiente}>{pendiente ? "Creando…" : "➕ Empezar a armar"}</button>
    </form>
  );
}

function Editor({ token, a, volver }: { token: string | null; a: ArmadoUI; volver: () => void }) {
  const router = useRouter();
  const editable = EDITABLES.includes(a.estado);
  const [editando, setEditando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, start] = useTransition();
  const sugeridas = partesSugeridas(a.tipo);
  const listo = (r: R, msj = "Guardado ✓") => {
    if (r?.error) { setError(r.error); setAviso(null); return false; }
    setError(null); setAviso(msj); router.refresh(); return true;
  };
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(null), 2500); return () => clearTimeout(t); }, [aviso]);

  const pedir = () => start(async () => { listo(await pedirPresupuestoArmado(token, a.id), "¡Listo! Te avisamos cuando tengamos el presupuesto."); });
  const borrar = () => {
    const msj = a.estado === "borrador" ? `¿Borrar "${a.nombre}"? Se pierden las partes cargadas.` : `¿Cancelar el pedido de "${a.nombre}"?`;
    if (!confirm(msj)) return;
    start(async () => { if (listo(await borrarArmado(token, a.id))) volver(); });
  };
  const quitar = (id: string) => {
    if (a.estado === "presupuestado" && !confirm(AVISO_CAMBIO)) return;
    start(async () => { listo(await borrarParte(token, a.id, id), "Parte quitada"); });
  };

  return (
    <div className="space-y-5">
      <button type="button" onClick={volver} className="muted text-sm hover:underline">← Mis armados</button>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-xl font-semibold">{a.nombre}</h2>
        <Estado estado={a.estado} />
      </div>

      <div aria-live="polite" className="min-h-5 text-sm">
        {aviso && <span className="font-medium text-emerald-700">{aviso}</span>}
        {error && <span role="alert" className="text-red-600">{error}</span>}
      </div>

      {a.estado === "presupuestado" && <Presupuesto token={token} a={a} />}
      {a.estado === "enviado" && <p className="card text-sm" style={{ background: "var(--soft)" }}>⏳ Recibimos tu pedido. Te pasamos el presupuesto acá y te avisamos por el chat. Si querés, podés seguir cambiando partes mientras tanto.</p>}
      {a.estado === "aprobado" && <p className="card text-sm" style={{ background: "var(--soft)" }}>✅ Aprobaste el presupuesto ({pesos(a.presupuesto)}). Te escribimos por el chat para coordinar.</p>}
      {a.estado === "rechazado" && <p className="card text-sm" style={{ background: "var(--soft)" }}>No aprobaste este presupuesto. Si querés, armá uno nuevo con otras partes o escribinos por el chat.</p>}

      {editable && <DatosArmado token={token} a={a} alGuardar={listo} />}

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Partes ({a.partes.length})</h3>
        {a.partes.length === 0 && <p className="card muted text-sm">Todavía no cargaste partes. Empezá por la que más te importe 👇</p>}
        <ul className="space-y-2">
          {a.partes.map((p) => editando === p.id ? (
            <li key={p.id}><FormParte token={token} a={a} p={p} sugeridas={sugeridas} cerrar={() => setEditando(null)} alGuardar={listo} /></li>
          ) : (
            <li key={p.id} className="card flex flex-wrap items-start gap-3 !p-4">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="muted text-xs font-semibold uppercase tracking-wide">{p.parte}</p>
                <p className="font-medium">{[p.nombre, p.modelo].filter(Boolean).join(" · ")}</p>
                {p.notas && <p className="muted whitespace-pre-line text-sm">{p.notas}</p>}
                {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer nofollow" className="link inline-block max-w-full truncate text-sm">Ver producto ↗</a>}
              </div>
              {p.precio != null && <p className="font-semibold">{pesos(p.precio)}</p>}
              {editable && (
                <div className="flex gap-2 text-sm">
                  <button type="button" className="btn-ghost !px-3 !py-1.5" onClick={() => setEditando(p.id)} disabled={pendiente}>Editar</button>
                  <button type="button" className="btn-ghost !px-3 !py-1.5" onClick={() => quitar(p.id)} disabled={pendiente} aria-label={`Quitar ${p.parte}`}>Quitar</button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {editable && editando === null && <FormParte token={token} a={a} sugeridas={sugeridas} alGuardar={listo} />}
      </section>

      {editable && (
        <div className="flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
          {a.estado === "borrador" && (
            <button type="button" className="btn flex-1 sm:flex-none" onClick={pedir} disabled={pendiente || a.partes.length === 0}>
              {pendiente ? "Enviando…" : "📨 Pedir presupuesto"}
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={borrar} disabled={pendiente}>
            {a.estado === "borrador" ? "Borrar armado" : "Cancelar pedido"}
          </button>
          {a.estado === "borrador" && a.partes.length === 0 && <p className="muted w-full text-xs">Agregá al menos una parte para pedir el presupuesto.</p>}
        </div>
      )}
    </div>
  );
}

function DatosArmado({ token, a, alGuardar }: { token: string | null; a: ArmadoUI; alGuardar: (r: R) => boolean }) {
  const { pendiente, onSubmit } = useEnviar(async (fd) => {
    if (a.estado === "presupuestado" && !confirm(AVISO_CAMBIO)) return undefined;
    const r = await guardarDatosArmado(token, a.id, undefined, fd);
    alGuardar(r);
    return r;
  });
  return (
    <details className="card">
      <summary className="cursor-pointer font-semibold">Datos del armado</summary>
      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field"><span>Nombre</span><input name="nombre" required maxLength={120} defaultValue={a.nombre} /></label>
          <label className="field"><span>Qué instrumento</span>
            <select name="tipo" defaultValue={a.tipo ?? "Otro"}>{TIPOS_ARMADO.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
        </div>
        <label className="field"><span>Comentarios para el taller (opcional)</span>
          <textarea name="notas" rows={3} maxLength={4000} defaultValue={a.notas ?? ""} placeholder="Ej.: lo quiero para tocar blues, color sunburst, presupuesto aproximado…" />
        </label>
        <button className="btn-ghost" disabled={pendiente}>{pendiente ? "Guardando…" : "Guardar datos"}</button>
      </form>
    </details>
  );
}

function FormParte({ token, a, p, sugeridas, cerrar, alGuardar }: {
  token: string | null; a: ArmadoUI; p?: ParteUI; sugeridas: string[]; cerrar?: () => void; alGuardar: (r: R, msj?: string) => boolean;
}) {
  const [clave, setClave] = useState(0); // para vaciar el form después de agregar
  const { estado, pendiente, onSubmit } = useEnviar(async (fd) => {
    if (a.estado === "presupuestado" && !confirm(AVISO_CAMBIO)) return undefined;
    const r = await guardarParte(token, a.id, p?.id ?? null, undefined, fd);
    if (alGuardar(r, p ? "Guardado ✓" : "Parte agregada ✓")) { if (cerrar) cerrar(); else setClave((k) => k + 1); }
    return r;
  });
  const lista = `partes-${a.id}`;
  return (
    <form key={clave} onSubmit={onSubmit} className="card space-y-3" style={p ? { borderColor: "var(--accent)" } : undefined}>
      <h4 className="font-semibold">{p ? "Editar parte" : "➕ Agregar una parte"}</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field"><span>Parte</span>
          <input name="parte" list={lista} required maxLength={80} defaultValue={p?.parte} placeholder="Ej.: Pastilla del puente" autoComplete="off" />
          <datalist id={lista}>{sugeridas.map((s) => <option key={s} value={s} />)}</datalist>
        </label>
        <label className="field"><span>Marca / producto</span><input name="nombre" required maxLength={160} defaultValue={p?.nombre} placeholder="Ej.: Seymour Duncan" /></label>
        <label className="field"><span>Modelo (opcional)</span><input name="modelo" maxLength={160} defaultValue={p?.modelo ?? ""} placeholder="Ej.: JB SH-4" /></label>
        <label className="field"><span>Link del producto (opcional)</span><input name="link" type="url" inputMode="url" maxLength={1000} defaultValue={p?.link ?? ""} placeholder="https://…" /></label>
      </div>
      <label className="field"><span>Algo más (opcional)</span><textarea name="notas" rows={2} maxLength={1000} defaultValue={p?.notas ?? ""} placeholder="Color, medida, si ya lo tenés vos…" /></label>
      {estado?.error && <p role="alert" className="text-sm text-red-600">{estado.error}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn" disabled={pendiente}>{pendiente ? "Guardando…" : p ? "Guardar cambios" : "Agregar parte"}</button>
        {cerrar && <button type="button" className="btn-ghost" onClick={cerrar}>Cancelar</button>}
      </div>
    </form>
  );
}

function Presupuesto({ token, a }: { token: string | null; a: ArmadoUI }) {
  const router = useRouter();
  const [comentario, setComentario] = useState("");
  const [pendiente, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const responder = (aprobar: boolean) => start(async () => {
    const r = await responderArmado(token, a.id, aprobar, comentario);
    if (r.error) setError(r.error); else router.refresh();
  });
  return (
    <div className="space-y-3 rounded-xl border-2 p-4" style={{ borderColor: "var(--accent)" }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">Presupuesto del taller</p>
        <p className="text-2xl font-bold">{pesos(a.presupuesto)}</p>
      </div>
      {a.detalle_presupuesto && <p className="whitespace-pre-line text-sm">{a.detalle_presupuesto}</p>}
      <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} placeholder="Comentario (opcional)" aria-label="Comentario para el taller"
        className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--bg)", color: "var(--fg)" }} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn flex-1" disabled={pendiente} onClick={() => responder(true)}>{pendiente ? "Enviando…" : "Aprobar"}</button>
        <button type="button" className="btn-ghost flex-1" disabled={pendiente} onClick={() => responder(false)}>No aprobar</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <p className="muted text-xs">Si cambiás alguna parte, el presupuesto deja de valer y lo pedís de nuevo.</p>
    </div>
  );
}
