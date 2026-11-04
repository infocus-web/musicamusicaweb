"use client";

import { useEffect } from "react";

/**
 * Hace que todos los links "wa.me" de la web abran WhatsApp sin pasar por la página intermedia de WhatsApp:
 * - Celular: el link normal ya abre la app, no se toca.
 * - Computadora: intenta abrir la app de WhatsApp instalada (whatsapp://). Si no la tiene,
 *   abre directo WhatsApp Web con el mensaje escrito. Si alguna vez abrió la app, lo recuerda.
 */
export function WhatsAppDirecto() {
  useEffect(() => {
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return;

    function alHacerClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='https://wa.me/']") as HTMLAnchorElement | null;
      if (!a) return;
      const u = new URL(a.href);
      const tel = u.pathname.replace(/\D/g, "");
      const texto = u.searchParams.get("text") ?? "";
      const q = `${tel ? `phone=${tel}&` : ""}text=${encodeURIComponent(texto)}`;
      e.preventDefault();

      let tieneApp = false;
      try { tieneApp = localStorage.getItem("wa-app") === "1"; } catch {}
      let abrioApp = false;
      const alSalir = () => { abrioApp = true; try { localStorage.setItem("wa-app", "1"); } catch {} };
      window.addEventListener("blur", alSalir, { once: true });
      window.location.href = `whatsapp://send?${q}`;

      // Si la app no se abrió (no está instalada), WhatsApp Web directo con el mensaje.
      if (!tieneApp) {
        setTimeout(() => {
          window.removeEventListener("blur", alSalir);
          if (!abrioApp && document.hasFocus()) window.open(`https://web.whatsapp.com/send?${q}`, "_blank", "noopener");
        }, 2500);
      }
    }
    document.addEventListener("click", alHacerClick);
    return () => document.removeEventListener("click", alHacerClick);
  }, []);
  return null;
}
