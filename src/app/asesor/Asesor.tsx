"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { TarjetaUsado } from "@/components/TarjetaUsado";
import type { Usado } from "@/lib/usados";
import { resultadoAsesor } from "./actions";

/* ---------------- Preguntas ---------------- */

type Opcion = { id: string; label: string; detalle?: string; categoria?: string; icono?: string };
type Paso = { id: string; pregunta: string; ayuda?: string; opciones: Opcion[]; multiple?: boolean };

const INSTRUMENTOS: Opcion[] = [
  { id: "Guitarra eléctrica", label: "Guitarra eléctrica", categoria: "guitarras", icono: "guitarra" },
  { id: "Guitarra criolla / acústica", label: "Criolla / acústica", categoria: "guitarras", icono: "guitarra" },
  { id: "Bajo", label: "Bajo", categoria: "bajos", icono: "guitarra" },
  { id: "Amplificador / pedales", label: "Ampli o pedales", categoria: "amplificadores", icono: "ampli" },
  { id: "Teclado / piano", label: "Teclado / piano", categoria: "teclados", icono: "teclado" },
  { id: "Batería / percusión", label: "Batería / percusión", categoria: "bateria", icono: "bateria" },
  { id: "Violín / cuerdas frotadas", label: "Violín, viola, cello", categoria: "cuerdas-frotadas", icono: "violin" },
  { id: "Vientos", label: "Vientos", categoria: "vientos", icono: "viento" },
  { id: "Sonido / grabación", label: "Sonido o home studio", categoria: "sonido", icono: "mic" },
  { id: "No sé", label: "No sé todavía", icono: "duda" },
];

const OBJETIVOS: Opcion[] = [
  { id: "comprar", label: "Quiero comprar", detalle: "Te recomiendo según tu nivel y presupuesto", icono: "compra" },
  { id: "reparar", label: "Arreglar o poner a punto el mío", detalle: "Te digo qué service necesita", icono: "llave" },
  { id: "vender", label: "Vender o permutar el mío", detalle: "Tasación online con fotos", icono: "permuta" },
];

const PASOS: Record<string, Paso[]> = {
  comprar: [
    { id: "instrumento", pregunta: "¡Buenísimo! ¿Qué estás buscando?", opciones: INSTRUMENTOS },
    { id: "nivel", pregunta: "¿Qué nivel tenés?", ayuda: "Así te recomiendo lo justo, ni de más ni de menos.", opciones: [
      { id: "Principiante", label: "Principiante", detalle: "Estoy empezando o es un regalo" },
      { id: "Intermedio", label: "Intermedio", detalle: "Toco hace un tiempo y quiero mejorar" },
      { id: "Profesional", label: "Profesional", detalle: "Toco en vivo o grabo" },
    ] },
    { id: "presupuesto", pregunta: "¿Qué presupuesto manejás?", opciones: [
      { id: "hasta150", label: "Hasta $150.000" },
      { id: "150a400", label: "$150.000 a $400.000" },
      { id: "400a1m", label: "$400.000 a $1.000.000" },
      { id: "mas1m", label: "Más de $1.000.000" },
      { id: "nose", label: "No sé, asesorame" },
    ] },
    { id: "preferencia", pregunta: "Última: ¿nuevo o usado?", ayuda: "Nuestros usados pasan por el banco del taller y tienen garantía.", opciones: [
      { id: "usado", label: "Usado revisado", detalle: "Rinde más la plata" },
      { id: "nuevo", label: "Nuevo" },
      { id: "igual", label: "Me da igual, lo mejor por la plata" },
    ] },
  ],
  reparar: [
    { id: "instrumento", pregunta: "Contame, ¿qué instrumento es?", opciones: INSTRUMENTOS.filter((o) => o.id !== "No sé") },
    { id: "problema", pregunta: "¿Qué le pasa?", ayuda: "Marcá todo lo que notes y tocá Listo.", multiple: true, opciones: [
      { id: "No afina bien", label: "No afina / desafina arriba" },
      { id: "Trastea o zumba", label: "Trastea o zumba" },
      { id: "Cuerdas muy altas", label: "Cuerdas muy altas, cuesta tocar" },
      { id: "Falla eléctrica", label: "Ruidos o no suena" },
      { id: "Algo roto", label: "Algo roto o despegado" },
      { id: "Trastes gastados", label: "Trastes gastados" },
      { id: "Puesta a punto", label: "Nada grave: puesta a punto" },
    ] },
    { id: "urgencia", pregunta: "¿Para cuándo lo necesitás?", opciones: [
      { id: "Tengo una fecha pronto", label: "Tengo show o grabación pronto" },
      { id: "Esta semana", label: "Esta semana" },
      { id: "Sin apuro", label: "Sin apuro" },
    ] },
  ],
  vender: [],
};

function servicioSugerido(problemas: string[]) {
  if (problemas.includes("Falla eléctrica")) return "Revisión de electrónica: potes, jack, soldaduras y blindaje.";
  if (problemas.includes("Trastes gastados")) return "Nivelado y coronado de trastes (o cambio, según el desgaste).";
  if (problemas.includes("Algo roto")) return "Diagnóstico de reparación: lo vemos y te pasamos presupuesto antes de tocar nada.";
  if (problemas.some((p) => ["No afina bien", "Trastea o zumba", "Cuerdas muy altas"].includes(p))) return "Calibración completa: alma, altura de cuerdas, octavación y cejuela.";
  return "Puesta a punto general: limpieza, calibración, lubricación y cuerdas nuevas.";
}

/* ---------------- Íconos ---------------- */

function Icono({ n }: { n?: string }) {
  const p = { viewBox: "0 0 24 24", className: "h-5 w-5 shrink-0", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (n) {
    case "guitarra": return <svg {...p}><path d="M19 2l3 3-6.5 6.5" /><path d="M11.5 10.5a4 4 0 0 0-5.3.6 3 3 0 0 0-1.4 3.4L2 17.3 6.7 22l2.8-2.8a3 3 0 0 0 3.4-1.4 4 4 0 0 0 .6-5.3z" /><circle cx="9" cy="15" r="1" /></svg>;
    case "ampli": return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="12" cy="13" r="4" /><path d="M7 7h.01M10 7h.01" /></svg>;
    case "teclado": return <svg {...p}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M7 6v7M12 6v7M17 6v7" /></svg>;
    case "bateria": return <svg {...p}><ellipse cx="12" cy="9" rx="8" ry="3" /><path d="M4 9v6c0 1.7 3.6 3 8 3s8-1.3 8-3V9" /><path d="M5 3l5 5M19 3l-5 5" /></svg>;
    case "violin": return <svg {...p}><path d="M12 2v6" /><path d="M9 8h6l1 3-1 2 1 3-2 5h-4l-2-5 1-3-1-2z" /></svg>;
    case "viento": return <svg {...p}><path d="M4 20l12-12" /><path d="M16 8l3-1 2 2-1 3-3 1" /><path d="M8 16h.01M11 13h.01" /></svg>;
    case "mic": return <svg {...p}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v5" /></svg>;
    case "compra": return <svg {...p}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>;
    case "llave": return <svg {...p}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" /></svg>;
    case "permuta": return <svg {...p}><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>;
    case "duda": return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" /></svg>;
    default: return null;
  }
}

/* ---------------- Burbujas ---------------- */

function Avatar() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: "var(--accent)" }} aria-hidden>MM</span>
  );
}

function Bot({ children }: { children: React.ReactNode }) {
  return (
    <div className="aparecer flex items-end gap-2">
      <Avatar />
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[15px]" style={{ background: "color-mix(in srgb, var(--fg) 7%, var(--card))" }}>{children}</div>
    </div>
  );
}

function Yo({ texto, onEditar }: { texto: string; onEditar?: () => void }) {
  return (
    <div className="aparecer flex justify-end">
      <button type="button" onClick={onEditar} title={onEditar ? "Cambiar esta respuesta" : undefined}
        className="group max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-left text-[15px] text-white" style={{ background: "var(--accent)" }}>
        {texto}
        {onEditar && <span className="ml-2 text-xs opacity-60 group-hover:opacity-100">✎</span>}
      </button>
    </div>
  );
}

function Escribiendo() {
  return (
    <div className="aparecer flex items-end gap-2" aria-label="El asesor está escribiendo">
      <Avatar />
      <div className="flex gap-1 rounded-2xl rounded-bl-sm px-4 py-3" style={{ background: "color-mix(in srgb, var(--fg) 7%, var(--card))" }}>
        {[0, 1, 2].map((i) => <span key={i} className="punto h-2 w-2 rounded-full" style={{ background: "var(--muted)" }} />)}
      </div>
    </div>
  );
}

/* ---------------- Asesor ---------------- */

type Props = { whatsapp: string | null; compacto?: boolean; alCerrar?: () => void };

export function Asesor({ whatsapp, compacto = false, alCerrar }: Props) {
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [resp, setResp] = useState<Record<string, string[]>>({});
  const [i, setI] = useState(0);
  const [final, setFinal] = useState<{ usados: Usado[] } | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [multiSel, setMultiSel] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  const pasos = objetivo ? PASOS[objetivo] : [];
  const paso = pasos[i];
  const terminado = !!final || objetivo === "vender";
  const progreso = terminado ? 100 : objetivo ? Math.round(((i + 1) / (pasos.length + 1)) * 100) : 5;

  // "Escribiendo…" breve antes de cada pregunta: da sensación de conversación.
  useEffect(() => {
    setEscribiendo(true);
    const t = setTimeout(() => setEscribiendo(false), 550);
    return () => clearTimeout(t);
  }, [objetivo, i, final]);

  // Siempre mostrar lo último.
  useEffect(() => {
    const c = caja.current;
    if (c) c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
  }, [objetivo, i, final, escribiendo, resp, cargando]);

  const etiqueta = (p: Paso, ids: string[]) => ids.map((id) => p.opciones.find((o) => o.id === id)?.label ?? id).join(", ");

  async function terminar(r: Record<string, string[]>) {
    setCargando(true);
    const inst = INSTRUMENTOS.find((o) => o.id === r.instrumento?.[0]);
    const plano: Record<string, string> = {};
    pasos.forEach((p) => { plano[p.id] = etiqueta(p, r[p.id] ?? []); });
    try {
      setFinal(await resultadoAsesor(objetivo!, { ...plano, categoria: inst?.categoria ?? "", presupuestoId: r.presupuesto?.[0] ?? "", preferencia: r.preferencia?.[0] ?? "" }));
    } catch {
      setFinal({ usados: [] });
    }
    setCargando(false);
  }

  function responder(ids: string[]) {
    const nuevo = { ...resp, [paso.id]: ids };
    setResp(nuevo);
    setMultiSel([]);
    if (i + 1 < pasos.length) setI(i + 1);
    else terminar(nuevo);
  }

  function elegirObjetivo(id: string) {
    setObjetivo(id); setI(0); setResp({}); setFinal(null);
    if (id === "vender") resultadoAsesor("vender", {}).catch(() => {});
  }

  function volverA(k: number) {
    // Cambiar una respuesta anterior: se borra desde ahí en adelante.
    const r: Record<string, string[]> = {};
    pasos.slice(0, k).forEach((p) => { if (resp[p.id]) r[p.id] = resp[p.id]; });
    setResp(r); setI(k); setFinal(null); setMultiSel(resp[pasos[k].id] ?? []);
  }

  function reiniciar() { setObjetivo(null); setResp({}); setI(0); setFinal(null); setMultiSel([]); setCargando(false); }
  const respondidos = final || cargando ? pasos.length : i;

  // Atajos: 1-9 eligen opción, Backspace vuelve.
  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      // Si el asesor flotante está abierto, solo él responde al teclado.
      if (!compacto && document.querySelector('[role="dialog"][aria-label="Asesor del taller"]')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 9 && !escribiendo && !cargando) {
        if (!objetivo && OBJETIVOS[n - 1]) elegirObjetivo(OBJETIVOS[n - 1].id);
        else if (paso && !final && paso.opciones[n - 1]) {
          const id = paso.opciones[n - 1].id;
          if (paso.multiple) setMultiSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
          else responder([id]);
        }
      }
      if (e.key === "Escape" && alCerrar) alCerrar();
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  const resumen = pasos.map((p) => `• ${p.pregunta.replace(/^[^¿]*¿/, "").replace("?", "")}: ${etiqueta(p, resp[p.id] ?? []) || "—"}`).join("\n");
  const msg = objetivo === "reparar"
    ? `Hola! Hice el asesor de la web. Necesito un service:\n${resumen}\nSugerido: ${servicioSugerido(resp.problema ?? [])}`
    : `Hola! Hice el asesor de la web y busco recomendación:\n${resumen}`;
  const wa = useMemo(() => {
    let n = (whatsapp ?? "").replace(/\D/g, "");
    if (!n) return null;
    if (!n.startsWith("54")) n = "549" + n.replace(/^0/, "");
    return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
  }, [whatsapp, msg]);

  const respuestas = ({ ops, onClick, activos = [], numerar = true }: { ops: Opcion[]; onClick: (id: string) => void; activos?: string[]; numerar?: boolean }) => (
    <div className={`aparecer grid gap-2 pl-10 ${compacto ? "" : "sm:grid-cols-2"}`}>
      {ops.map((o, k) => {
        const on = activos.includes(o.id);
        return (
          <button key={o.id} type="button" onClick={() => onClick(o.id)}
            className="group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            style={{ borderColor: on ? "var(--accent)" : "var(--line)", background: on ? "color-mix(in srgb, var(--accent) 12%, var(--card))" : "var(--card)" }}>
            {o.icono ? <span style={{ color: "var(--accent)" }}><Icono n={o.icono} /></span> : numerar ? <span className="muted w-4 text-center text-xs">{k + 1}</span> : null}
            <span className="flex-1">
              <span className="block text-sm font-medium">{o.label}</span>
              {o.detalle && <span className="muted block text-xs">{o.detalle}</span>}
            </span>
            {on && <span style={{ color: "var(--accent)" }}>✓</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`flex flex-col ${compacto ? "h-full" : "card !p-0 overflow-hidden"}`}>
      {/* Encabezado */}
      <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--line)" }}>
        <Avatar />
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">Asesor del taller</p>
          <p className="muted text-xs"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Te responde en 30 segundos</p>
        </div>
        {objetivo && <button type="button" onClick={reiniciar} className="muted text-xs hover:underline">Empezar de nuevo</button>}
        {alCerrar && <button type="button" onClick={alCerrar} className="muted grid h-8 w-8 place-items-center rounded-full text-lg hover:opacity-70" aria-label="Cerrar asesor">×</button>}
      </div>
      <div className="h-1" style={{ background: "var(--line)" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${progreso}%`, background: "var(--accent)" }} />
      </div>

      {/* Conversación */}
      <div ref={caja} className={`min-h-0 flex-1 space-y-3 overflow-y-auto p-4 ${compacto ? "" : "h-[480px]"}`}>
        <Bot>¡Hola! Soy el asesor de Música Música Web. ¿En qué te ayudo?</Bot>
        {!objetivo ? (
          !escribiendo && respuestas({ ops: OBJETIVOS, onClick: elegirObjetivo })
        ) : (
          <Yo texto={OBJETIVOS.find((o) => o.id === objetivo)!.label} onEditar={reiniciar} />
        )}

        {objetivo === "vender" && (escribiendo ? <Escribiendo /> : (
          <>
            <Bot>¡Genial! Mandame fotos y datos de tu instrumento y te paso una tasación. Te lo compramos, lo tomamos en parte de pago o lo vendemos en consignación.</Bot>
            <div className="aparecer flex flex-wrap gap-2 pl-10">
              <Link href="/usados/vender" className="btn">Pedir tasación</Link>
              <Link href="/usados/vender?quiere=permutar" className="btn-ghost">Quiero permutar</Link>
            </div>
          </>
        ))}

        {pasos.slice(0, respondidos).map((p, k) => (
          <div key={p.id} className="space-y-3">
            <Bot>{p.pregunta}</Bot>
            <Yo texto={etiqueta(p, resp[p.id] ?? [])} onEditar={() => volverA(k)} />
          </div>
        ))}

        {paso && !final && !cargando && (escribiendo ? <Escribiendo /> : (
          <>
            <Bot>
              {paso.pregunta}
              {paso.ayuda && <span className="muted block text-xs">{paso.ayuda}</span>}
            </Bot>
            {paso.multiple ? (
              <>
                {respuestas({ ops: paso.opciones, activos: multiSel, onClick: (id) => setMultiSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])) })}
                <div className="pl-10"><button type="button" className="btn w-full" disabled={!multiSel.length} onClick={() => responder(multiSel)}>Listo ({multiSel.length})</button></div>
              </>
            ) : (
              respuestas({ ops: paso.opciones, onClick: (id) => responder([id]), activos: resp[paso.id] })
            )}
          </>
        ))}

        {cargando && <Escribiendo />}

        {final && (
          <>
            {escribiendo ? <Escribiendo /> : (
              <>
                {objetivo === "reparar" ? (
                  <Bot>
                    Por lo que me contás, te recomiendo:
                    <span className="mt-1 block font-semibold">{servicioSugerido(resp.problema ?? [])}</span>
                    {resp.urgencia?.[0] === "Tengo una fecha pronto" && <span className="mt-1 block text-sm">Pasame la fecha por WhatsApp y priorizamos el turno.</span>}
                  </Bot>
                ) : (
                  <Bot>
                    {resp.nivel?.[0] === "Principiante" && <span className="mb-1 block">Un consejo del taller: para empezar, un instrumento bien calibrado importa más que la marca. </span>}
                    {final.usados.length ? "Mirá estos usados revisados que encajan con lo que buscás:" : "Ahora no tengo un usado publicado que encaje justo. Escribime y te paso opciones nuevas o usadas que todavía no publicamos."}
                  </Bot>
                )}
                {final.usados.length > 0 && (
                  <div className={`aparecer grid gap-3 pl-10 ${compacto ? "" : "sm:grid-cols-3"}`}>
                    {final.usados.map((u) => <TarjetaUsado key={u.id} u={u} />)}
                  </div>
                )}
                <div className="aparecer space-y-2 pl-10">
                  {wa ? (
                    <a href={wa} target="_blank" rel="noreferrer" className="btn w-full !py-3 text-base">Hablar con un técnico por WhatsApp</a>
                  ) : (
                    <p className="muted text-sm">Muy pronto vas a poder mandarnos esto por WhatsApp.</p>
                  )}
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    {objetivo === "comprar" ? <Link href="/usados" className="link">Ver todos los usados →</Link> : <Link href="/registro" className="link">Registrate como cliente →</Link>}
                    <button type="button" onClick={reiniciar} className="muted hover:underline">Empezar de nuevo</button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
      {!compacto && <p className="muted border-t px-4 py-2 text-[11px]" style={{ borderColor: "var(--line)" }}>Tip: podés usar los números del teclado para elegir, y tocar tus respuestas para cambiarlas.</p>}
    </div>
  );
}
