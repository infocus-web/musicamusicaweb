"use client";
import { useTransition } from "react";
import { cerrarAvisos } from "./actions";

/** Abre WhatsApp con el mensaje y marca los avisos como enviados. */
export function BotonEnviar({ ids, href }: { ids: string[]; href: string }) {
  const [pendiente, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      <a href={href} onClick={() => start(() => cerrarAvisos(ids))}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: "#25D366" }}>
        {pendiente ? "Marcando…" : "Enviar por WhatsApp"}
      </a>
      <button type="button" disabled={pendiente} onClick={() => start(() => cerrarAvisos(ids, true))} className="btn-ghost !py-2 text-sm">Ya le avisé / descartar</button>
    </div>
  );
}
