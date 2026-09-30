"use client";

import { useRef } from "react";

/** Fila horizontal deslizable con flechas (estilo "Novedades"). */
export function Carrusel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mover = (d: number) => ref.current?.scrollBy({ left: d * (ref.current.clientWidth * 0.8), behavior: "smooth" });
  return (
    <div className="relative">
      <div ref={ref} className="sin-barra flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [&>*]:w-[46%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[31%] lg:[&>*]:w-[19%]">
        {children}
      </div>
      {[-1, 1].map((d) => (
        <button key={d} type="button" onClick={() => mover(d)} aria-label={d < 0 ? "Anterior" : "Siguiente"}
          className={`absolute top-1/3 hidden h-10 w-10 place-items-center rounded-full bg-white text-xl shadow-lg ring-1 ring-black/5 hover:scale-105 sm:grid ${d < 0 ? "-left-4" : "-right-4"}`}>
          {d < 0 ? "‹" : "›"}
        </button>
      ))}
    </div>
  );
}
