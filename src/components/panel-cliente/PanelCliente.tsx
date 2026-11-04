import "server-only";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClientePanel } from "@/lib/acceso-cliente";
import { ESTADOS_ACTIVOS, formatoFecha, formatoPesos } from "@/lib/estados";
import { obtenerAjustes, waTaller } from "@/lib/ajustes";
import { Logo } from "@/components/Logo";
import { EstadoBadge } from "@/components/EstadoBadge";
import { TrabajosCliente } from "@/components/TrabajosCliente";
import { TextoLargo } from "@/components/TextoLargo";
import { ChatCliente } from "./ChatCliente";
import { Aprobacion } from "./Aprobacion";
import { FormTurno } from "./FormTurno";
import { FormClave } from "./FormClave";
import { ArmaTuInstrumento, type ArmadoUI } from "./ArmaTuInstrumento";
import { cookies } from "next/headers";
import { BotonTema } from "@/app/taller/BotonTema";

const PESTANAS = [
  { id: "inicio", label: "Inicio", icono: "🏠" },
  { id: "instrumentos", label: "Mis instrumentos", icono: "🎸" },
  { id: "armar", label: "Armá tu instrumento", icono: "🛠️" },
  { id: "mensajes", label: "Mensajes", icono: "💬" },
  { id: "turno", label: "Pedir turno", icono: "📅" },
  { id: "historial", label: "Historial", icono: "🧾" },
  { id: "cuenta", label: "Mi cuenta", icono: "👤" },
] as const;

type Trabajo = { id: string; numero: string; servicio: string; estado: string; presupuesto: number | null; fecha_ingreso: string; fecha_entrega: string | null; instrumentos: { tipo: string; marca: string | null; modelo: string | null } | null };
const nombreInst = (t: Trabajo) => (t.instrumentos ? [t.instrumentos.tipo, t.instrumentos.marca, t.instrumentos.modelo].filter(Boolean).join(" ") : t.servicio);

/**
 * Panel del cliente. Lo usan /mi-cuenta (con sesión) y /seguimiento/[token] (link privado).
 * Quien lo llama ya validó al cliente; todo se lee del lado del servidor.
 */
export async function PanelCliente({ cliente, token, tab = "inicio", base, salir }: {
  cliente: ClientePanel; token: string | null; tab?: string; base: string; salir?: React.ReactNode;
}) {
  const db = createAdminClient();
  const activa = PESTANAS.some((p) => p.id === tab) ? tab : "inicio";
  const [{ data: trabajosData }, { count: sinLeer }, ajustes, { data: armadosPresup }] = await Promise.all([
    db.from("trabajos").select("id, numero, servicio, estado, presupuesto, fecha_ingreso, fecha_entrega, instrumentos(tipo, marca, modelo)")
      .eq("cliente_id", cliente.id).neq("estado", "cancelado").order("fecha_ingreso", { ascending: false }),
    db.from("mensajes").select("id", { count: "exact", head: true }).eq("cliente_id", cliente.id).eq("autor", "taller").eq("leido_cliente", false),
    obtenerAjustes(),
    db.from("armados").select("id, nombre, presupuesto").eq("cliente_id", cliente.id).eq("estado", "presupuestado"),
  ]);
  const presupArmados = armadosPresup ?? [];
  const trabajos = (trabajosData ?? []) as unknown as Trabajo[];
  const activos = trabajos.filter((t) => (ESTADOS_ACTIVOS as string[]).includes(t.estado));
  const ids = trabajos.map((t) => t.id);
  const { data: aprobData } = ids.length
    ? await db.from("aprobaciones").select("id, trabajo_id, tipo, monto, detalle").in("trabajo_id", ids).eq("estado", "pendiente").order("creado_en")
    : { data: [] };
  const pendientes = aprobData ?? [];
  const wa = waTaller(ajustes.whatsapp, `Hola! Soy ${cliente.nombre} (${cliente.codigo}).`);
  const url = (id: string) => `${base}?tab=${id}`;
  const oscuro = (await cookies()).get("tema-cliente")?.value === "oscuro";

  return (
    <div id="panel-cliente" className={`min-h-screen ${oscuro ? "tema-oscuro" : ""}`}>
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Ir a la web"><Logo alto={48} prioridad /></Link>
          <div>
            <h1 className="text-xl font-semibold">Hola, {cliente.nombre.split(" ")[0]} 👋</h1>
            <p className="muted text-xs">Cliente <span className="font-mono">{cliente.codigo}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-white" style={{ background: "#25D366" }}>WhatsApp</a>}
          <BotonTema inicial={oscuro} destino="panel-cliente" cookie="tema-cliente" />
          {salir}
        </div>
      </header>

      {/* Celular: pestañas que se deslizan. Computadora: menú vertical a la izquierda. */}
      <div className="space-y-5 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:space-y-0">
      <nav aria-label="Secciones de tu panel" className="sin-barra -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:sticky lg:top-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {PESTANAS.map((p) => {
          const n = p.id === "mensajes" ? sinLeer ?? 0 : p.id === "inicio" ? pendientes.length : p.id === "armar" ? presupArmados.length : 0;
          const sel = p.id === activa;
          return (
            <Link key={p.id} href={url(p.id)} aria-current={sel ? "page" : undefined}
              className="relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition lg:gap-2.5 lg:rounded-xl lg:py-2.5"
              style={sel ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : { borderColor: "var(--line)" }}>
              <span aria-hidden>{p.icono}</span><span className="lg:flex-1">{p.label}</span>
              {n > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold" style={sel ? { background: "#fff", color: "var(--accent)" } : { background: "var(--accent)", color: "#fff" }}>{n}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="min-w-0 space-y-5">
      {activa === "inicio" && (
        <div className="space-y-5">
          {pendientes.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">⚠️ Necesitamos tu aprobación</h2>
              {pendientes.map((a) => {
                const t = trabajos.find((x) => x.id === a.trabajo_id);
                return (
                  <Aprobacion key={a.id} token={token} id={a.id} monto={formatoPesos(Number(a.monto))} detalle={a.detalle}
                    titulo={`${a.tipo === "ampliacion" ? "Ampliación de presupuesto" : "Presupuesto"} · ${t ? nombreInst(t) : ""} (${t?.numero ?? ""})`} />
                );
              })}
            </section>
          )}

          {presupArmados.map((a) => (
            <Link key={a.id} href={url("armar")} className="card flex items-center gap-3 !p-4" style={{ borderColor: "var(--accent)" }}>
              <span className="text-2xl" aria-hidden>🛠️</span>
              <span className="flex-1"><b>Ya tenés el presupuesto de “{a.nombre}”: {formatoPesos(Number(a.presupuesto))}</b><br /><span className="muted text-sm">Tocá para verlo y aprobarlo</span></span>
              <span aria-hidden>→</span>
            </Link>
          ))}

          {(sinLeer ?? 0) > 0 && (
            <Link href={url("mensajes")} className="card flex items-center gap-3 !p-4" style={{ borderColor: "var(--accent)" }}>
              <span className="text-2xl" aria-hidden>💬</span>
              <span className="flex-1"><b>Tenés {sinLeer} mensaje{sinLeer === 1 ? "" : "s"} nuevo{sinLeer === 1 ? "" : "s"} del taller</b><br /><span className="muted text-sm">Tocá para leer y responder</span></span>
              <span aria-hidden>→</span>
            </Link>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Tus instrumentos en el taller</h2>
            {activos.length === 0 && (
              <p className="card muted text-sm">No tenés instrumentos en el taller ahora. Cuando quieras traer uno, pedí turno desde el menú.</p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {activos.map((t) => (
                <Link key={t.id} href={url("instrumentos")} className="card space-y-2 !p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{nombreInst(t)}</p>
                    <EstadoBadge estado={t.estado} />
                  </div>
                  <p className="muted text-xs">Orden <span className="font-mono">{t.numero}</span> · {t.servicio} · ingresó {formatoFecha(t.fecha_ingreso)}</p>
                  <p className="link text-sm">Ver fotos y videos →</p>
                </Link>
              ))}
            </div>
          </section>

          <Link href={url("armar")} className="card flex items-center gap-4 !p-4 transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-3xl" aria-hidden>🛠️</span>
            <span className="flex-1"><b>Armá tu instrumento</b><br /><span className="muted text-sm">Elegí cada parte (cuerpo, mástil, pastillas…) y te lo presupuestamos.</span></span>
            <span className="btn !px-4 !py-2 text-sm">Empezar</span>
          </Link>

          <Novedades />
        </div>
      )}

      {activa === "instrumentos" && <div className="space-y-4"><TrabajosCliente clienteId={cliente.id} token={token} /></div>}

      {activa === "armar" && <Armados clienteId={cliente.id} token={token} />}

      {activa === "mensajes" && (
        <section className="space-y-2">
          <ChatCliente token={token} ordenes={activos.map((t) => ({ id: t.id, nombre: `${nombreInst(t)} (${t.numero})` }))} />
          <p className="muted text-center text-xs">Te respondemos en horario de taller. Si es urgente, escribinos por WhatsApp.</p>
        </section>
      )}

      {activa === "turno" && (
        <section className="space-y-3">
          <TusTurnos clienteId={cliente.id} />
          <p className="muted text-sm">Atendemos con turno. Elegí cuándo te queda bien y te confirmamos por el chat.</p>
          <FormTurno token={token} />
        </section>
      )}

      {activa === "historial" && <Historial trabajos={trabajos} />}

      {activa === "cuenta" && (
        <div className="space-y-4">
          <FormClave token={token} tieneClave={!!cliente.user_id} usuario={cliente.telefono ? `tu teléfono (${cliente.telefono})` : cliente.email ? `tu email (${cliente.email})` : `tu código ${cliente.codigo}`} />
          <section className="card space-y-1 text-sm">
            <h2 className="font-semibold">Tus datos</h2>
            <p>{cliente.nombre}</p>
            <p className="muted">{[cliente.telefono, cliente.email].filter(Boolean).join(" · ") || "Sin contacto cargado"}</p>
            <p className="muted text-xs">¿Algo está mal? Escribinos por el chat y lo corregimos.</p>
          </section>
          <Link href="/terminos" className="link text-sm">Términos y condiciones</Link>
        </div>
      )}

      </div>
      </div>

      {token && <p className="muted text-center text-xs">Este link es personal: no lo compartas.</p>}
    </div>
    </div>
  );
}

async function TusTurnos({ clienteId }: { clienteId: string }) {
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
  const { data } = await createAdminClient().from("turnos").select("id, fecha, hora, franja, estado")
    .eq("cliente_id", clienteId).in("estado", ["pedido", "confirmado"]).gte("fecha", hoy).order("fecha");
  if (!data?.length) return null;
  return (
    <div className="card space-y-2">
      <h2 className="font-semibold">Tus turnos</h2>
      <ul className="space-y-1.5 text-sm">{data.map((t) => (
        <li key={t.id} className="flex flex-wrap items-center gap-2">
          <span className="capitalize">{new Date(t.fecha + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}{t.hora ? ` · ${t.hora} h` : t.franja ? ` · ${t.franja}` : ""}</span>
          <span className={`badge ${t.estado === "confirmado" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{t.estado === "confirmado" ? "Confirmado" : "Esperando confirmación"}</span>
        </li>))}</ul>
    </div>
  );
}

async function Armados({ clienteId, token }: { clienteId: string; token: string | null }) {
  const { data } = await createAdminClient().from("armados")
    .select("id, nombre, tipo, notas, estado, presupuesto, detalle_presupuesto, actualizado_en, armado_partes(id, parte, nombre, modelo, link, notas, precio, orden)")
    .eq("cliente_id", clienteId).neq("estado", "cancelado").order("actualizado_en", { ascending: false });
  type Fila = Omit<ArmadoUI, "partes"> & { armado_partes: (ArmadoUI["partes"][number] & { orden: number })[] };
  // Los valores solo se muestran cuando el taller ya mandó el presupuesto (no mientras lo está armando).
  const conValores = ["presupuestado", "aprobado", "rechazado"];
  const armados: ArmadoUI[] = ((data ?? []) as unknown as Fila[]).map(({ armado_partes, ...a }) => {
    const ver = conValores.includes(a.estado);
    return {
      ...a,
      presupuesto: ver && a.presupuesto != null ? Number(a.presupuesto) : null,
      detalle_presupuesto: ver ? a.detalle_presupuesto : null,
      partes: [...(armado_partes ?? [])].sort((x, y) => x.orden - y.orden)
        .map((p) => ({ id: p.id, parte: p.parte, nombre: p.nombre, modelo: p.modelo, link: p.link, notas: p.notas, precio: ver && p.precio != null ? Number(p.precio) : null })),
    };
  });
  return <ArmaTuInstrumento token={token} armados={armados} />;
}

async function Novedades() {
  const { data } = await createAdminClient().from("novedades").select("id, titulo, texto, link, creado_en").eq("publicada", true).order("creado_en", { ascending: false }).limit(5);
  if (!data?.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">📣 Novedades del taller</h2>
      {data.map((n) => (
        <article key={n.id} className="card space-y-1.5 !p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold">{n.titulo}</h3><span className="muted text-xs">{formatoFecha(n.creado_en)}</span></div>
          {n.texto && <div className="text-sm"><TextoLargo texto={n.texto} /></div>}
          {n.link && <a href={n.link} className="link text-sm" target={n.link.startsWith("/") ? undefined : "_blank"} rel="noreferrer">Ver más →</a>}
        </article>
      ))}
    </section>
  );
}

async function Historial({ trabajos }: { trabajos: Trabajo[] }) {
  const db = createAdminClient();
  const ids = trabajos.map((t) => t.id);
  const [{ data: comprobantes }, { data: cobros }] = await Promise.all([
    ids.length ? db.from("comprobantes").select("id, numero, fecha, referencia, total").in("trabajo_id", ids).eq("anulado", false).order("fecha", { ascending: false }) : Promise.resolve({ data: [] as { id: string; numero: number; fecha: string; referencia: string | null; total: number }[] }),
    ids.length ? db.from("cobros").select("id, fecha, monto, medio, trabajo_numero").in("trabajo_id", ids).order("fecha", { ascending: false }) : Promise.resolve({ data: [] as { id: string; fecha: string; monto: number; medio: string; trabajo_numero: string | null }[] }),
  ]);
  const terminados = trabajos.filter((t) => t.estado === "entregado");
  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Trabajos terminados</h2>
        {terminados.length === 0 && <p className="card muted text-sm">Todavía no hay trabajos entregados.</p>}
        {terminados.length > 0 && (
          <div className="card overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead className="muted text-left"><tr><th className="p-3">Orden</th><th className="p-3">Instrumento</th><th className="p-3">Entregado</th><th className="p-3 text-right">Total</th></tr></thead>
              <tbody>{terminados.map((t) => (
                <tr key={t.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                  <td className="p-3 font-mono">{t.numero}</td><td className="p-3">{nombreInst(t)}<div className="muted text-xs">{t.servicio}</div></td>
                  <td className="p-3">{formatoFecha(t.fecha_entrega)}</td><td className="p-3 text-right">{formatoPesos(t.presupuesto)}</td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
      </section>
      {(cobros?.length ?? 0) > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pagos registrados</h2>
          <ul className="card divide-y !p-0 text-sm">{cobros!.map((c) => (
            <li key={c.id} className="flex justify-between gap-2 p-3" style={{ borderColor: "var(--line)" }}><span>{formatoFecha(c.fecha)} · {c.trabajo_numero ?? ""} · {c.medio}</span><b>{formatoPesos(Number(c.monto))}</b></li>))}</ul>
        </section>
      )}
      {(comprobantes?.length ?? 0) > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Comprobantes</h2>
          <ul className="card divide-y !p-0 text-sm">{comprobantes!.map((c) => (
            <li key={c.id} className="flex justify-between gap-2 p-3" style={{ borderColor: "var(--line)" }}><span>N° {String(c.numero).padStart(6, "0")} · {formatoFecha(c.fecha)} · {c.referencia ?? ""}</span><b>{formatoPesos(Number(c.total))}</b></li>))}</ul>
        </section>
      )}
    </div>
  );
}
