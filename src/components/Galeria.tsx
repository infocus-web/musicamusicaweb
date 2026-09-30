"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

const LENTE = 260;   // diámetro de la lupa (px)
const ZOOM = 2.6;    // aumento

/**
 * Galería de fotos con lupa: en compu, al pasar el mouse aparece un círculo que agranda la zona (como StewMac).
 * En el celular, tocar la foto la abre a pantalla completa y se puede hacer zoom con los dedos.
 */
export function Galeria({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [lupa, setLupa] = useState<{ x: number; y: number; ox: number; oy: number; w: number; h: number } | null>(null);
  const [pantalla, setPantalla] = useState(false);
  const [puedeLupa, setPuedeLupa] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => { setPuedeLupa(window.matchMedia("(hover: hover) and (pointer: fine)").matches); }, []);
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

  if (fotos.length === 0) return <div className="grid aspect-square place-items-center rounded-lg muted" style={{ background: "var(--soft)" }}>Sin fotos</div>;

  function mover(e: React.MouseEvent<HTMLDivElement>) {
    const r = caja.current!.getBoundingClientRect();
    const im = img.current;
    // La foto va centrada ("contain"): calculamos el área real que ocupa dentro del cuadro.
    const nw = im?.naturalWidth || r.width, nh = im?.naturalHeight || r.height;
    const esc = Math.min(r.width / nw, r.height / nh);
    const w = nw * esc, h = nh * esc, ox = (r.width - w) / 2, oy = (r.height - h) / 2;
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < ox || x > ox + w || y < oy || y > oy + h) { setLupa(null); return; }
    setLupa({ x, y, ox, oy, w, h });
  }

  return (
    <div className="space-y-3">
      <div
        ref={caja}
        className="relative overflow-hidden rounded-lg bg-white"
        style={{ cursor: puedeLupa ? "zoom-in" : "pointer" }}
        onMouseMove={puedeLupa ? mover : undefined}
        onMouseLeave={() => setLupa(null)}
        onClick={() => setPantalla(true)}
      >
        <img ref={img} src={fotos[i]} alt={`${alt} — foto ${i + 1}`} className="aspect-square w-full select-none object-contain" draggable={false} />

        {puedeLupa && lupa && (
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-full border-4 border-white shadow-[0_8px_30px_rgba(0,0,0,.35)]"
            style={{
              width: LENTE, height: LENTE,
              left: lupa.x - LENTE / 2, top: lupa.y - LENTE / 2,
              backgroundColor: "white",
              backgroundImage: `url("${fotos[i]}")`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${lupa.w * ZOOM}px ${lupa.h * ZOOM}px`,
              backgroundPosition: `${-((lupa.x - lupa.ox) * ZOOM - LENTE / 2)}px ${-((lupa.y - lupa.oy) * ZOOM - LENTE / 2)}px`,
            }}
          />
        )}

        {!lupa && (
          <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" /></svg>
            {puedeLupa ? "Pasá el mouse para ver de cerca" : "Tocá para ampliar"}
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
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/95" role="dialog" aria-label="Foto ampliada">
          <div className="flex items-center justify-between p-3 text-white">
            <span className="text-sm">{i + 1} / {fotos.length}</span>
            <button type="button" onClick={() => setPantalla(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-2xl" aria-label="Cerrar">×</button>
          </div>
          {/* touch-action pinch-zoom: en el celular se agranda con dos dedos */}
          <div className="flex-1 overflow-auto" style={{ touchAction: "pinch-zoom pan-x pan-y" }}>
            <img src={fotos[i]} alt={alt} className="mx-auto h-full w-full object-contain" />
          </div>
          {fotos.length > 1 && (
            <div className="flex justify-center gap-4 p-4">
              <button type="button" onClick={() => setI((i - 1 + fotos.length) % fotos.length)} className="rounded-full bg-white/15 px-5 py-2 text-white">‹ Anterior</button>
              <button type="button" onClick={() => setI((i + 1) % fotos.length)} className="rounded-full bg-white/15 px-5 py-2 text-white">Siguiente ›</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
