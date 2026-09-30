"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Asesor } from "@/app/asesor/Asesor";

const OCULTO_EN = ["/taller", "/login", "/asesor", "/checkout", "/mi-cuenta/ingresar"];

/** Botón fijo abajo a la derecha que abre el asesor en un panel tipo chat. */
export function AsesorFlotante({ whatsapp }: { whatsapp: string | null }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [globo, setGlobo] = useState(false);

  // Globito de invitación una vez por visita, a los 7 segundos.
  useEffect(() => {
    let visto = false;
    try { visto = sessionStorage.getItem("mmw-asesor-globo") === "1"; } catch {}
    if (visto || window.location.pathname === "/") return;
    const t = setTimeout(() => setGlobo(true), 7000);
    return () => clearTimeout(t);
  }, []);
  const cerrarGlobo = () => { setGlobo(false); try { sessionStorage.setItem("mmw-asesor-globo", "1"); } catch {} };

  useEffect(() => {
    const abrir = () => { setAbierto(true); cerrarGlobo(); };
    window.addEventListener("abrir-asesor", abrir);
    return () => window.removeEventListener("abrir-asesor", abrir);
  }, []);

  const oculto = OCULTO_EN.some((r) => ruta?.startsWith(r));
  useEffect(() => {
    (window as unknown as { __asesorFlotante?: boolean }).__asesorFlotante = !oculto;
  }, [oculto]);

  if (oculto) return null;

  return (
    <>
      {abierto && (
        <div className="fixed inset-0 z-50 sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[620px] sm:max-h-[calc(100vh-7rem)] sm:w-[400px]">
          <div className="absolute inset-0 bg-black/40 sm:hidden" onClick={() => setAbierto(false)} />
          <div className="aparecer absolute inset-x-0 bottom-0 top-10 overflow-hidden rounded-t-3xl shadow-2xl sm:inset-0 sm:rounded-3xl"
            style={{ background: "var(--card)", border: "1px solid var(--line)" }} role="dialog" aria-label="Asesor del taller">
            <Asesor whatsapp={whatsapp} compacto alCerrar={() => setAbierto(false)} />
          </div>
        </div>
      )}

      {globo && !abierto && (
        <div className="aparecer fixed bottom-24 right-5 z-40 max-w-[260px] rounded-2xl rounded-br-sm p-3 pr-8 text-sm shadow-xl" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <button type="button" onClick={cerrarGlobo} className="muted absolute right-2 top-1 text-lg" aria-label="Cerrar">×</button>
          <b>¿Te ayudo a elegir?</b>
          <span className="muted block">Comprar, arreglar o vender tu instrumento: te respondo en 30 segundos.</span>
          <button type="button" className="link mt-1 text-sm font-semibold" onClick={() => { setAbierto(true); cerrarGlobo(); }}>Empezar →</button>
        </div>
      )}

      <button
        type="button"
        onClick={() => { setAbierto(!abierto); cerrarGlobo(); }}
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full px-5 py-3.5 font-bold text-white shadow-xl transition hover:scale-105 ${abierto ? "" : "latido"} ${abierto ? "max-sm:hidden" : ""}`}
        style={{ background: "var(--accent)" }}
        aria-expanded={abierto}
        aria-label={abierto ? "Cerrar asesor" : "Abrir asesor"}
      >
        {abierto ? (
          <span className="text-xl leading-none">×</span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8M8 13h5" />
          </svg>
        )}
        <span>{abierto ? "Cerrar" : "Asesor"}</span>
      </button>
    </>
  );
}

/** Botón que abre el asesor flotante desde cualquier parte de la página. */
export function BotonAbrirAsesor({ children, className }: { children: React.ReactNode; className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("abrir-asesor"))}>{children}</button>;
}
