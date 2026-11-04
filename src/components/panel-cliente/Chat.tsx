"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MensajeChat = { id: string; autor: "cliente" | "taller"; tipo: string; texto: string; creado_en: string; trabajo: string | null };

const hora = (d: string) => new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });

/**
 * Chat reutilizable (cliente y taller). Se actualiza solo cada pocos segundos.
 * `yo` indica de qué lado está quien mira: sus mensajes van a la derecha.
 */
export function Chat({ yo, leer, enviar, ordenes = [], vacio, alto = "h-[60vh]", rapidas = [] }: {
  yo: "cliente" | "taller";
  leer: () => Promise<MensajeChat[] | null>;
  enviar: (texto: string, trabajoId: string | null) => Promise<{ ok: boolean; error?: string }>;
  ordenes?: { id: string; nombre: string }[];
  vacio?: string;
  alto?: string;
  rapidas?: string[];
}) {
  const [mensajes, setMensajes] = useState<MensajeChat[] | null>(null);
  const [texto, setTexto] = useState("");
  const [orden, setOrden] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lista = useRef<HTMLDivElement>(null);
  const cantidad = useRef(0);

  const actualizar = useCallback(async () => {
    const m = await leer();
    if (m) setMensajes(m);
  }, [leer]);

  useEffect(() => {
    actualizar();
    const t = setInterval(() => { if (document.visibilityState === "visible") actualizar(); }, 8000);
    return () => clearInterval(t);
  }, [actualizar]);

  // Baja al último mensaje cuando llega uno nuevo.
  useEffect(() => {
    if (mensajes && mensajes.length !== cantidad.current) {
      cantidad.current = mensajes.length;
      lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: "smooth" });
    }
  }, [mensajes]);

  async function mandar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true); setError(null);
    const r = await enviar(texto, orden || null);
    setEnviando(false);
    if (r.ok) { setTexto(""); actualizar(); } else setError(r.error ?? "No se pudo enviar.");
  }

  return (
    <div className="card flex flex-col !p-0">
      <div ref={lista} className={`${alto} space-y-3 overflow-y-auto p-4`} aria-live="polite">
        {mensajes === null && <p className="muted text-sm">Cargando…</p>}
        {mensajes?.length === 0 && <p className="muted py-10 text-center text-sm">{vacio ?? "Todavía no hay mensajes."}</p>}
        {mensajes?.map((m) => {
          const mio = m.autor === yo;
          const especial = m.tipo !== "texto";
          return (
            <div key={m.id} className={`flex ${mio ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${mio ? "rounded-br-sm" : "rounded-bl-sm"}`}
                style={mio ? { background: "var(--accent)", color: "#fff" } : { background: "var(--soft)", color: "var(--fg)", border: especial ? "1px solid var(--accent)" : undefined }}>
                {m.trabajo && <p className={`mb-0.5 font-mono text-[11px] ${mio ? "text-white/80" : "muted"}`}>Orden {m.trabajo}</p>}
                <p className="whitespace-pre-line break-words">{m.texto}</p>
                <p className={`mt-1 text-right text-[10px] ${mio ? "text-white/75" : "muted"}`}>{m.autor === "taller" && yo === "cliente" ? "Taller · " : ""}{hora(m.creado_en)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={mandar} className="space-y-2 border-t p-3" style={{ borderColor: "var(--line)" }}>
        {ordenes.length > 1 && (
          <select value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Sobre qué instrumento"
            className="w-full rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
            <option value="">Mensaje general</option>
            {ordenes.map((o) => <option key={o.id} value={o.id}>Sobre: {o.nombre}</option>)}
          </select>
        )}
        {rapidas.length > 0 && (
          <div className="sin-barra -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Respuestas rápidas">
            {rapidas.map((r) => (
              <button key={r} type="button" onClick={() => setTexto((t) => (t ? `${t} ${r}` : r))}
                className="shrink-0 rounded-full border px-3 py-1 text-xs hover:bg-[var(--soft)]" style={{ borderColor: "var(--line)" }} title={r}>
                {r.length > 38 ? r.slice(0, 36) + "…" : r}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} placeholder="Escribí tu mensaje…" aria-label="Mensaje"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); mandar(e); } }}
            className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--bg)", color: "var(--fg)" }} />
          <button className="btn !px-4" disabled={enviando || !texto.trim()} aria-label="Enviar">{enviando ? "…" : "Enviar"}</button>
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
