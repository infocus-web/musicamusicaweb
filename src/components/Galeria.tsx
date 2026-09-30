"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

const LENTE = 260;        // diámetro de la lupa en compu (px)
const LENTE_TACTIL = 170; // diámetro de la lupa en el celular (px)
const ZOOM = 2.6;         // aumento de la lupa
const ZOOM_PANTALLA = 2.5; // aumento al tocar la foto a pantalla completa
const ESPERA = 220;       // ms que hay que mantener apretado para que salga la lupa en el celular

type Lupa = { x: number; y: number; ox: number; oy: number; w: number; h: number; cx: number; cy: number; tactil: boolean };

/**
 * Galería de fotos con lupa (como StewMac).
 * - Compu: pasás el mouse y aparece un círculo que agranda la zona.
 * - Celular: mantenés el dedo apretado sobre la foto y aparece la lupa arriba del dedo; la arrastrás para recorrer.
 *   Un toque corto abre la foto a pantalla completa; ahí, tocando la foto se agranda y arrastrando se recorre.
 */
export function Galeria({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [lupa, setLupa] = useState<Lupa | null>(null);
  const [pantalla, setPantalla] = useState(false);
  const [puedeHover, setPuedeHover] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => { setPuedeHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches); }, []);
  useEffect(() => {
    if (!pantalla) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPantalla(false);
      if (e.key === "ArrowRight") setI((n) => (n + 1) % fotos.length);
      if (e.key === "ArrowLeft") setI((n) => (n - 1 + fotos.length) % fotos.length);
    };
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [pantalla, fotos.length]);

  /** Calcula dónde está el punto dentro de la foto (que va centrada, "contain"). Devuelve null si cae afuera. */
  function calcular(clientX: number, clientY: number, tactil: boolean): Lupa | null {
    const r = caja.current?.getBoundingClientRect();
    if (!r) return null;
    const im = img.current;
    const nw = im?.naturalWidth || r.width, nh = im?.naturalHeight || r.height;
    const esc = Math.min(r.width / nw, r.height / nh);
    const w = nw * esc, h = nh * esc, ox = (r.width - w) / 2, oy = (r.height - h) / 2;
    const x = clientX - r.left, y = clientY - r.top;
    if (x < ox || x > ox + w || y < oy || y > oy + h) return null;
    return { x, y, ox, oy, w, h, cx: clientX, cy: clientY, tactil };
  }

  // ---- Lupa táctil: mantener apretado ----
  const lupaRef = useRef<Lupa | null>(null);
  lupaRef.current = lupa;
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inicio: { x: number; y: number } | null = null;
    let activa = false;
    let seMovio = false;

    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1) { cancelar(); return; }
      const t = e.touches[0];
      inicio = { x: t.clientX, y: t.clientY };
      activa = false; seMovio = false;
      timer = setTimeout(() => {
        const l = calcular(t.clientX, t.clientY, true);
        if (l) { activa = true; setLupa(l); navigator.vibrate?.(10); }
      }, ESPERA);
    };
    const move = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!inicio || !t) return;
      if (activa) {
        e.preventDefault(); // mientras está la lupa, el dedo no mueve la página
        setLupa(calcular(t.clientX, t.clientY, true) ?? lupaRef.current);
        return;
      }
      if (Math.abs(t.clientX - inicio.x) > 8 || Math.abs(t.clientY - inicio.y) > 8) { seMovio = true; clearTimeout(timer); }
    };
    const end = (e: TouchEvent) => {
      clearTimeout(timer);
      if (activa) { e.preventDefault(); setLupa(null); }       // soltar = se va la lupa (sin abrir pantalla completa)
      else if (!seMovio && inicio && !(e.target as HTMLElement).closest("button")) { e.preventDefault(); setPantalla(true); }
      activa = false; inicio = null;
    };
    const cancelar = () => { clearTimeout(timer); activa = false; inicio = null; setLupa(null); };

    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end, { passive: false });
    el.addEventListener("touchcancel", cancelar);
    const sinMenu = (e: Event) => e.preventDefault(); // que no salga el menú "guardar imagen"
    el.addEventListener("contextmenu", sinMenu);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", cancelar);
      el.removeEventListener("contextmenu", sinMenu);
    };
  }, [fotos.length]);

  if (fotos.length === 0) return <div className="grid aspect-square place-items-center rounded-lg muted" style={{ background: "var(--soft)" }}>Sin fotos</div>;

  const d = lupa?.tactil ? LENTE_TACTIL : LENTE;
  const estiloLente = lupa && {
    width: d, height: d,
    backgroundColor: "white",
    backgroundImage: `url("${fotos[i]}")`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${lupa.w * ZOOM}px ${lupa.h * ZOOM}px`,
    backgroundPosition: `${-((lupa.x - lupa.ox) * ZOOM - d / 2)}px ${-((lupa.y - lupa.oy) * ZOOM - d / 2)}px`,
  };

  return (
    <div className="space-y-3">
      <div
        ref={caja}
        className="relative select-none overflow-hidden rounded-lg bg-white"
        style={{ cursor: puedeHover ? "zoom-in" : "pointer", WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
        onMouseMove={puedeHover ? (e) => setLupa(calcular(e.clientX, e.clientY, false)) : undefined}
        onMouseLeave={() => { if (!lupa?.tactil) setLupa(null); }}
        onClick={puedeHover ? () => setPantalla(true) : undefined}
      >
        <img ref={img} src={fotos[i]} alt={`${alt} — foto ${i + 1}`} className="aspect-square w-full select-none object-contain" draggable={false} />

        {lupa && !lupa.tactil && estiloLente && (
          <div aria-hidden className="pointer-events-none absolute rounded-full border-4 border-white shadow-[0_8px_30px_rgba(0,0,0,.35)]"
            style={{ ...estiloLente, left: lupa.x - d / 2, top: lupa.y - d / 2 }} />
        )}

        {!lupa && (
          <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" /></svg>
            {puedeHover ? "Pasá el mouse para ver de cerca" : "Mantené apretado: lupa · Tocá: ampliar"}
          </span>
        )}
        {fotos.length > 1 && (
          <>
            <button type="button" aria-label="Foto anterior" onClick={(e) => { e.stopPropagation(); setI((i - 1 + fotos.length) % fotos.length); }}
              className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl shadow">‹</button>
            <button type="button" aria-label="Foto siguiente" onClick={(e) => { e.stopPropagation(); setI((i + 1) % fotos.length); }}
              className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl shadow">›</button>
          </>
        )}
      </div>

      {/* Lupa del celular: flota arriba del dedo para que no la tape */}
      {lupa?.tactil && estiloLente && (
        <div aria-hidden className="pointer-events-none fixed z-[110] rounded-full border-4 border-white shadow-[0_8px_30px_rgba(0,0,0,.45)]"
          style={{ ...estiloLente, left: Math.min(Math.max(lupa.cx - d / 2, 4), window.innerWidth - d - 4), top: Math.max(lupa.cy - d - 36, 4) }} />
      )}

      {fotos.length > 1 && (
        <div className="sin-barra flex gap-2 overflow-x-auto">
          {fotos.map((f, j) => (
            <button key={f} type="button" onClick={() => setI(j)} className="shrink-0 overflow-hidden rounded border-2 bg-white" style={{ borderColor: j === i ? "var(--accent)" : "var(--line)" }} aria-label={`Ver foto ${j + 1}`}>
              <img src={f} alt="" className="h-16 w-16 object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {pantalla && (
        <PantallaCompleta fotos={fotos} i={i} setI={setI} alt={alt} cerrar={() => setPantalla(false)} />
      )}
    </div>
  );
}

/** Foto a pantalla completa: tocar agranda en ese punto, arrastrar recorre, volver a tocar achica. Deslizar cambia de foto. */
function PantallaCompleta({ fotos, i, setI, alt, cerrar }: { fotos: string[]; i: number; setI: (f: (n: number) => number) => void; alt: string; cerrar: () => void }) {
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null); // origen del zoom en %
  const area = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  useEffect(() => setZoom(null), [i]);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    let inicio: { x: number; y: number; t: number } | null = null;
    let movio = false;
    const pos = (x: number, y: number) => {
      const r = el.getBoundingClientRect();
      return { x: Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((y - r.top) / r.height) * 100)) };
    };
    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      inicio = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }; movio = false;
    };
    const move = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!inicio || !t) return;
      e.preventDefault();
      if (Math.abs(t.clientX - inicio.x) > 8 || Math.abs(t.clientY - inicio.y) > 8) movio = true;
      if (zoomRef.current) setZoom(pos(t.clientX, t.clientY)); // con zoom: el dedo recorre la foto
    };
    const end = (e: TouchEvent) => {
      if (!inicio) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - inicio.x;
      const z = zoomRef.current;
      if (!movio) setZoom(z ? null : pos(t.clientX, t.clientY));                 // toque: agranda / achica
      else if (!z && Math.abs(dx) > 60 && fotos.length > 1) setI((n) => (n + (dx < 0 ? 1 : -1) + fotos.length) % fotos.length); // deslizar: otra foto
      inicio = null;
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    return () => { el.removeEventListener("touchstart", start); el.removeEventListener("touchmove", move); el.removeEventListener("touchend", end); };
  }, [fotos.length, setI]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black" role="dialog" aria-label="Foto ampliada">
      <div className="flex items-center justify-between p-3 text-white">
        <span className="text-sm">{i + 1} / {fotos.length} <span className="ml-2 opacity-70">{zoom ? "Arrastrá para recorrer · tocá para achicar" : "Tocá la foto para agrandar"}</span></span>
        <button type="button" onClick={cerrar} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-2xl" aria-label="Cerrar">×</button>
      </div>
      <div ref={area} className="relative flex-1 overflow-hidden" style={{ touchAction: "none", cursor: zoom ? "zoom-out" : "zoom-in" }}
        onClick={(e) => { // compu
          if ((e.nativeEvent as PointerEvent).pointerType === "touch") return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom((z) => (z ? null : { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }));
        }}
        onMouseMove={(e) => {
          if (!zoom) return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}>
        <img src={fotos[i]} alt={alt} draggable={false}
          className="h-full w-full select-none object-contain transition-transform duration-150"
          style={{ transform: zoom ? `scale(${ZOOM_PANTALLA})` : "none", transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "50% 50%" }} />
      </div>
      {fotos.length > 1 && (
        <div className="flex justify-center gap-4 p-4">
          <button type="button" onClick={() => setI((n) => (n - 1 + fotos.length) % fotos.length)} className="rounded-full bg-white/15 px-5 py-2 text-white">‹ Anterior</button>
          <button type="button" onClick={() => setI((n) => (n + 1) % fotos.length)} className="rounded-full bg-white/15 px-5 py-2 text-white">Siguiente ›</button>
        </div>
      )}
    </div>
  );
}
