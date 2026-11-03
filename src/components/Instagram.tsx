"use client";

import { createContext, useContext } from "react";

/** Degradé oficial de Instagram (para que se reconozca de un vistazo). */
export const DEGRADE_IG = "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";

/** Usuario de Instagram (sin @) cargado en el panel → Ajustes. Lo comparte el layout con toda la web. */
const Ctx = createContext<string | null>(null);

export function InstagramProvider({ usuario, children }: { usuario: string | null; children: React.ReactNode }) {
  const limpio = usuario?.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "") || null;
  return <Ctx.Provider value={limpio}>{children}</Ctx.Provider>;
}

export function useInstagram() {
  const usuario = useContext(Ctx);
  return usuario ? { usuario, url: `https://instagram.com/${usuario}` } : null;
}

export function IconoInstagram({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Franja grande "Seguinos en Instagram" (portada). */
export function FranjaInstagram() {
  const ig = useInstagram();
  if (!ig) return null;
  return (
    <section style={{ background: DEGRADE_IG }} className="text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-10 text-center sm:flex-row sm:text-left">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 ring-2 ring-white/40">
          <IconoInstagram className="h-9 w-9" />
        </span>
        <div className="flex-1 space-y-1">
          <h2 className="titulo text-3xl sm:text-4xl">Seguinos en Instagram</h2>
          <p className="text-base text-white/90 sm:text-lg">Trabajos del taller, antes y después, usados que entran y novedades. <b>@{ig.usuario}</b></p>
        </div>
        <a href={ig.url} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#cc2366] shadow-lg transition hover:scale-105">
          <IconoInstagram className="h-5 w-5" /> Seguir
        </a>
      </div>
    </section>
  );
}
