"use client";
import { useState } from "react";

/** Botón luna/sol: oscurece el panel del taller. Se recuerda en este navegador (cookie). */
export function BotonTema({ inicial }: { inicial: boolean }) {
  const [oscuro, setOscuro] = useState(inicial);
  function cambiar() {
    const n = !oscuro;
    setOscuro(n);
    document.getElementById("panel-taller")?.classList.toggle("tema-oscuro", n);
    document.cookie = `tema-taller=${n ? "oscuro" : "claro"}; path=/; max-age=31536000; samesite=lax`;
  }
  return (
    <button type="button" onClick={cambiar} title={oscuro ? "Pantalla clara" : "Oscurecer pantalla"} aria-label={oscuro ? "Pantalla clara" : "Oscurecer pantalla"}
      className="grid h-8 w-8 place-items-center rounded-full border transition hover:opacity-80" style={{ borderColor: "var(--line)" }}>
      {oscuro
        ? <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>}
    </button>
  );
}
