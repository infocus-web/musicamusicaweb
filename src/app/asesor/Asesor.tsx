"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TarjetaUsado } from "@/components/TarjetaUsado";
import type { Usado } from "@/lib/usados";
import { resultadoAsesor } from "./actions";

type Opcion = { id: string; label: string; detalle?: string; categoria?: string };
type Paso = { id: string; titulo: string; ayuda: string; opciones: Opcion[]; multiple?: boolean };

const INSTRUMENTOS: Opcion[] = [
  { id: "Guitarra eléctrica", label: "Guitarra eléctrica", categoria: "guitarras" },
  { id: "Guitarra criolla / acústica", label: "Guitarra criolla / acústica", categoria: "guitarras" },
  { id: "Bajo", label: "Bajo", categoria: "bajos" },
  { id: "Amplificador / pedales", label: "Amplificador o pedales", categoria: "amplificadores" },
  { id: "Teclado / piano", label: "Teclado / piano", categoria: "teclados" },
  { id: "Batería / percusión", label: "Batería / percusión", categoria: "bateria" },
  { id: "Violín / cuerdas frotadas", label: "Violín, viola, cello", categoria: "cuerdas-frotadas" },
  { id: "Vientos", label: "Vientos", categoria: "vientos" },
  { id: "Sonido / grabación", label: "Sonido, PA o home studio", categoria: "sonido" },
  { id: "No sé", label: "No sé todavía" },
];

const PASOS: Record<string, Paso[]> = {
  comprar: [
    { id: "instrumento", titulo: "¿Qué estás buscando?", ayuda: "Elegí lo más parecido.", opciones: INSTRUMENTOS },
    { id: "nivel", titulo: "¿Qué nivel tenés?", ayuda: "Para recomendarte lo justo, ni de más ni de menos.", opciones: [
      { id: "Principiante", label: "Principiante", detalle: "Estoy empezando o es un regalo" },
      { id: "Intermedio", label: "Intermedio", detalle: "Toco hace un tiempo y quiero mejorar el equipo" },
      { id: "Profesional", label: "Profesional", detalle: "Toco en vivo o grabo" },
    ] },
    { id: "presupuesto", titulo: "¿Qué presupuesto manejás?", ayuda: "Buscamos la mejor relación precio/calidad.", opciones: [
      { id: "hasta150", label: "Hasta $150.000" },
      { id: "150a400", label: "$150.000 a $400.000" },
      { id: "400a1m", label: "$400.000 a $1.000.000" },
      { id: "mas1m", label: "Más de $1.000.000" },
      { id: "nose", label: "No sé, asesorame" },
    ] },
    { id: "preferencia", titulo: "¿Nuevo o usado?", ayuda: "Nuestros usados pasan por el taller antes de venderse.", opciones: [
      { id: "usado", label: "Usado revisado", detalle: "Rinde más la plata, con garantía del taller" },
      { id: "nuevo", label: "Nuevo" },
      { id: "igual", label: "Me da igual, lo mejor por la plata" },
    ] },
  ],
  reparar: [
    { id: "instrumento", titulo: "¿Qué instrumento es?", ayuda: "Trabajamos todo tipo de instrumentos y equipos.", opciones: INSTRUMENTOS.filter((o) => o.id !== "No sé") },
    { id: "problema", titulo: "¿Qué le pasa?", ayuda: "Podés marcar varias.", multiple: true, opciones: [
      { id: "No afina bien", label: "No afina / desafina arriba del mástil" },
      { id: "Trastea o zumba", label: "Trastea o zumba alguna cuerda" },
      { id: "Cuerdas muy altas", label: "Las cuerdas están muy altas / cuesta tocar" },
      { id: "Falla eléctrica", label: "Ruidos, falsos contactos o no suena" },
      { id: "Algo roto", label: "Algo roto o despegado" },
      { id: "Trastes gastados", label: "Trastes gastados" },
      { id: "Puesta a punto", label: "Nada grave: quiero una puesta a punto" },
    ] },
    { id: "urgencia", titulo: "¿Para cuándo lo necesitás?", ayuda: "Así organizamos el turno.", opciones: [
      { id: "Tengo una fecha pronto", label: "Tengo un show o grabación pronto" },
      { id: "Esta semana", label: "Esta semana" },
      { id: "Sin apuro", label: "Sin apuro" },
    ] },
  ],
};

const OBJETIVOS: Opcion[] = [
  { id: "comprar", label: "Quiero comprar un instrumento", detalle: "Te recomendamos qué conviene según tu nivel y presupuesto" },
  { id: "reparar", label: "Quiero arreglar o poner a punto el mío", detalle: "Te decimos qué servicio necesita" },
  { id: "vender", label: "Quiero vender o permutar el mío", detalle: "Tasación online con fotos" },
];

function servicioSugerido(problemas: string[]) {
  if (problemas.includes("Falla eléctrica")) return "Revisión de electrónica (potes, jack, soldaduras y blindaje).";
  if (problemas.includes("Trastes gastados")) return "Nivelado y coronado de trastes, o cambio de trastes según el desgaste.";
  if (problemas.includes("Algo roto")) return "Diagnóstico de reparación: lo vemos en el taller y te pasamos presupuesto antes de tocar nada.";
  if (problemas.some((p) => ["No afina bien", "Trastea o zumba", "Cuerdas muy altas"].includes(p))) return "Calibración completa: alma, altura de cuerdas, octavación y ajuste de cejuela.";
  return "Puesta a punto general: limpieza, calibración, lubricación y cuerdas nuevas.";
}

export function Asesor({ whatsapp }: { whatsapp: string | null }) {
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [resp, setResp] = useState<Record<string, string[]>>({});
  const [final, setFinal] = useState<{ usados: Usado[] } | null>(null);
  const [cargando, setCargando] = useState(false);

  const pasos = objetivo ? PASOS[objetivo] ?? [] : [];
  const total = pasos.length + 1;
  const progreso = final || objetivo === "vender" ? 100 : Math.round(((objetivo ? i + 1 : 0) / total) * 100);

  const etiquetas = useMemo(() => {
    const out: Record<string, string> = {};
    pasos.forEach((p) => {
      const sel = resp[p.id] ?? [];
      out[p.id] = sel.map((id) => p.opciones.find((o) => o.id === id)?.label ?? id).join(", ");
    });
    return out;
  }, [pasos, resp]);

  async function terminar(r: Record<string, string[]>) {
    setCargando(true);
    const inst = INSTRUMENTOS.find((o) => o.id === r.instrumento?.[0]);
    const plano: Record<string, string> = {};
    pasos.forEach((p) => { plano[p.id] = (r[p.id] ?? []).map((id) => p.opciones.find((o) => o.id === id)?.label ?? id).join(", "); });
    try {
      setFinal(await resultadoAsesor(objetivo!, { ...plano, categoria: inst?.categoria ?? "", presupuestoId: r.presupuesto?.[0] ?? "", preferencia: r.preferencia?.[0] ?? "" }));
    } catch {
      setFinal({ usados: [] });
    }
    setCargando(false);
  }

  function elegir(p: Paso, id: string) {
    if (p.multiple) {
      const actual = resp[p.id] ?? [];
      setResp({ ...resp, [p.id]: actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id] });
      return;
    }
    const nuevo = { ...resp, [p.id]: [id] };
    setResp(nuevo);
    if (i + 1 < pasos.length) setI(i + 1);
    else terminar(nuevo);
  }

  function reiniciar() { setObjetivo(null); setI(0); setResp({}); setFinal(null); }
  function atras() { if (final) { setFinal(null); return; } if (i > 0) setI(i - 1); else reiniciar(); }

  const resumen = pasos.map((p) => `• ${p.titulo.replace("¿", "").replace("?", "")}: ${etiquetas[p.id] || "—"}`).join("\n");
  const msg = objetivo === "reparar"
    ? `Hola! Usé el asesor de la web. Necesito un service:\n${resumen}\nServicio sugerido: ${servicioSugerido(resp.problema ?? [])}`
    : `Hola! Usé el asesor de la web y busco recomendación:\n${resumen}`;
  let num = (whatsapp ?? "").replace(/\D/g, "");
  if (num && !num.startsWith("54")) num = "549" + num.replace(/^0/, "");
  const wa = num ? `https://wa.me/${num}?text=${encodeURIComponent(msg)}` : null;

  const Opciones = ({ ops, onClick, activos = [] }: { ops: Opcion[]; onClick: (id: string) => void; activos?: string[] }) => (
    <div className="grid gap-2 sm:grid-cols-2">
      {ops.map((o) => {
        const on = activos.includes(o.id);
        return (
          <button key={o.id} type="button" onClick={() => onClick(o.id)}
            className="rounded-xl border p-4 text-left transition hover:shadow-sm"
            style={{ borderColor: on ? "var(--accent)" : "var(--line)", background: on ? "color-mix(in srgb, var(--accent) 10%, var(--card))" : "var(--card)" }}>
            <span className="font-medium">{o.label}</span>
            {o.detalle && <span className="muted block text-sm">{o.detalle}</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
          <div className="h-full transition-all" style={{ width: `${progreso}%`, background: "var(--accent)" }} />
        </div>
        {objetivo && <button type="button" onClick={atras} className="muted text-sm hover:underline">← Atrás</button>}
      </div>

      {!objetivo && (
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">¿En qué te ayudamos?</h2>
          <p className="muted">Te respondemos en 30 segundos. Sin registrarte.</p>
          <Opciones ops={OBJETIVOS} onClick={(id) => { setObjetivo(id); setI(0); }} />
        </div>
      )}

      {objetivo === "vender" && (
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">Tasamos tu instrumento</h2>
          <p className="muted">Mandanos fotos y datos. Lo compramos, lo tomamos en parte de pago o lo vendemos en consignación.</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/usados/vender" className="btn">Pedir tasación</Link>
            <Link href="/usados" className="btn-ghost">Ver usados para permutar</Link>
          </div>
        </div>
      )}

      {objetivo && objetivo !== "vender" && !final && pasos[i] && (
        <div className="space-y-3">
          <p className="muted text-xs">Paso {i + 1} de {pasos.length}</p>
          <h2 className="text-2xl font-semibold">{pasos[i].titulo}</h2>
          <p className="muted">{pasos[i].ayuda}</p>
          <Opciones ops={pasos[i].opciones} onClick={(id) => elegir(pasos[i], id)} activos={resp[pasos[i].id]} />
          {pasos[i].multiple && (
            <button type="button" className="btn w-full" disabled={!(resp[pasos[i].id] ?? []).length}
              onClick={() => (i + 1 < pasos.length ? setI(i + 1) : terminar(resp))}>Siguiente</button>
          )}
          {cargando && <p className="muted text-sm">Buscando…</p>}
        </div>
      )}

      {final && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">{objetivo === "reparar" ? "Esto es lo que necesita" : "¡Listo! Esta es nuestra recomendación"}</h2>
          <ul className="card space-y-1 !p-4 text-sm">
            {pasos.map((p) => <li key={p.id}><span className="muted">{p.titulo.replace(/[¿?]/g, "")}: </span>{etiquetas[p.id] || "—"}</li>)}
          </ul>

          {objetivo === "reparar" && (
            <div className="rounded-xl p-4" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
              <p className="muted text-xs uppercase tracking-wide">Servicio sugerido</p>
              <p className="font-medium">{servicioSugerido(resp.problema ?? [])}</p>
              {resp.urgencia?.[0] === "Tengo una fecha pronto" && <p className="mt-2 text-sm">Contanos la fecha por WhatsApp y priorizamos el turno.</p>}
            </div>
          )}

          {objetivo === "comprar" && (
            <>
              {resp.nivel?.[0] === "Principiante" && (
                <p className="text-sm">Consejo del taller: para empezar, un instrumento bien calibrado importa más que la marca. Cuerdas bajas y buena afinación hacen que aprender sea mucho más fácil.</p>
              )}
              {final.usados.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="font-semibold">Usados revisados que encajan con lo que buscás</h3>
                  <div className="grid gap-3 sm:grid-cols-3">{final.usados.map((u) => <TarjetaUsado key={u.id} u={u} />)}</div>
                </div>
              ) : (
                <p className="muted text-sm">Ahora no tenemos un usado publicado que encaje justo; escribinos y te recomendamos opciones (nuevas o usadas que todavía no publicamos).</p>
              )}
            </>
          )}

          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className="btn w-full !py-3 text-base">Recibir mi recomendación por WhatsApp</a>
          ) : (
            <p className="muted text-sm">Muy pronto vas a poder enviarnos esto por WhatsApp.</p>
          )}
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            {objetivo === "comprar" ? <Link href="/usados" className="link">Mientras tanto, ver usados →</Link> : <Link href="/registro" className="link">Registrate como cliente →</Link>}
            <button type="button" onClick={reiniciar} className="muted hover:underline">Volver a empezar</button>
          </div>
        </div>
      )}
    </div>
  );
}
