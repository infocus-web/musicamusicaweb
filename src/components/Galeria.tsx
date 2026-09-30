"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

export function Galeria({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [i, setI] = useState(0);
  if (fotos.length === 0) return <div className="card grid aspect-[4/3] place-items-center muted">Sin fotos</div>;
  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl" style={{ background: "var(--line)" }}>
        <img src={fotos[i]} alt={`${alt} — foto ${i + 1}`} className="aspect-[4/3] w-full object-contain" />
        {fotos.length > 1 && (
          <>
            <button aria-label="Anterior" onClick={() => setI((i - 1 + fotos.length) % fotos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white">‹</button>
            <button aria-label="Siguiente" onClick={() => setI((i + 1) % fotos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white">›</button>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{i + 1}/{fotos.length}</span>
          </>
        )}
      </div>
      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {fotos.map((f, j) => (
            <button key={f} onClick={() => setI(j)} className="shrink-0 overflow-hidden rounded-lg border-2" style={{ borderColor: j === i ? "var(--accent)" : "transparent" }}>
              <img src={f} alt="" className="h-16 w-20 object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
