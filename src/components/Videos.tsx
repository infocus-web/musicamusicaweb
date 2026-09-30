"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { leerVideo, type VideoEmbebido } from "@/lib/video";

const NOMBRE = { youtube: "YouTube", instagram: "Instagram", tiktok: "TikTok", vimeo: "Vimeo" };

/** Un video embebido. El reproductor se carga recién al tocar play (la página abre más rápido). */
function Video({ v }: { v: VideoEmbebido }) {
  const [activo, setActivo] = useState(false);
  const alto = v.plataforma === "tiktok" ? "aspect-[9/16] max-h-[640px]" : v.plataforma === "instagram" ? "aspect-[4/5] max-h-[640px]" : v.vertical ? "aspect-[9/16] max-h-[640px]" : "aspect-video";
  return (
    <div className={`relative mx-auto w-full overflow-hidden rounded-xl bg-black ${alto}`}>
      {activo ? (
        <iframe src={v.embed} title={`Video de ${NOMBRE[v.plataforma]}`} className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" />
      ) : (
        <button type="button" onClick={() => setActivo(true)} className="group absolute inset-0 grid place-items-center" aria-label={`Reproducir video de ${NOMBRE[v.plataforma]}`}>
          {v.miniatura ? <img src={v.miniatura} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:opacity-100" loading="lazy" />
            : <span className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 40%, #3a0000, #000)" }} />}
          <span className="relative grid h-16 w-16 place-items-center rounded-full bg-red-600 text-white shadow-xl transition group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
          </span>
          <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-0.5 text-xs text-white">{NOMBRE[v.plataforma]}</span>
        </button>
      )}
    </div>
  );
}

/** Lista de videos a partir de sus links (ignora los links que no se reconocen). */
export function Videos({ links, columnas = 2 }: { links: string[]; columnas?: 1 | 2 | 3 }) {
  const vids = links.map(leerVideo).filter(Boolean) as VideoEmbebido[];
  if (!vids.length) return null;
  const cols = columnas === 1 ? "" : columnas === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";
  return <div className={`grid items-start gap-4 ${cols}`}>{vids.map((v) => <Video key={v.original} v={v} />)}</div>;
}
