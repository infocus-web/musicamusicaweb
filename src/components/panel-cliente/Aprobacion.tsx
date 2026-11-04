"use client";
import { useState, useTransition } from "react";
import { responderAprobacion } from "@/app/mi-cuenta/panel/actions";

/** Tarjeta para aprobar o rechazar un presupuesto / ampliación. */
export function Aprobacion({ token, id, titulo, monto, detalle }: { token: string | null; id: string; titulo: string; monto: string; detalle: string | null }) {
  const [comentario, setComentario] = useState("");
  const [pendiente, start] = useTransition();
  const [hecho, setHecho] = useState<null | "ok" | string>(null);
  const responder = (aprobar: boolean) => start(async () => {
    const r = await responderAprobacion(token, id, aprobar, comentario);
    setHecho(r.error ?? (aprobar ? "aprobado" : "rechazado"));
  });
  if (hecho === "aprobado" || hecho === "rechazado")
    return <p role="status" className="rounded-xl p-3 text-sm" style={{ background: "var(--soft)" }}>{hecho === "aprobado" ? "✅ ¡Gracias! Ya seguimos con el trabajo." : "Listo, le avisamos al taller. Te van a contactar."}</p>;
  return (
    <div className="space-y-3 rounded-xl border-2 p-4" style={{ borderColor: "var(--accent)" }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{titulo}</p>
        <p className="text-xl font-bold">{monto}</p>
      </div>
      {detalle && <p className="whitespace-pre-line text-sm">{detalle}</p>}
      <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} placeholder="Comentario (opcional)"
        className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--bg)", color: "var(--fg)" }} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn flex-1" disabled={pendiente} onClick={() => responder(true)}>{pendiente ? "Enviando…" : "Aprobar"}</button>
        <button type="button" className="btn-ghost flex-1" disabled={pendiente} onClick={() => responder(false)}>No aprobar</button>
      </div>
      {hecho && <p role="alert" className="text-sm text-red-600">{hecho}</p>}
    </div>
  );
}
