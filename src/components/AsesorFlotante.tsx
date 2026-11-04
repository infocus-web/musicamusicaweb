"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Asesor } from "@/app/asesor/Asesor";

const OCULTO_EN = ["/taller", "/login", "/asesor", "/checkout", "/mi-cuenta", "/seguimiento"];

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
        style={{ background: abierto ? "var(--accent)" : "#25D366" }}
        aria-expanded={abierto}
        aria-label={abierto ? "Cerrar asesor" : "Abrir asesor por WhatsApp"}
      >
        {abierto ? (
          <span className="text-xl leading-none">×</span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
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
