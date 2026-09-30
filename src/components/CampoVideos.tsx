"use client";

import { useState } from "react";
import { leerVideo } from "@/lib/video";

/** Campo del panel: pegar links de videos, uno por línea, con aviso si alguno no se reconoce. */
export function CampoVideos({ name = "videos", inicial = [] as string[], className = "" }: { name?: string; inicial?: string[]; className?: string }) {
  const [texto, setTexto] = useState(inicial.join("\n"));
  const lineas = texto.split(/\s+/).map((l) => l.trim()).filter(Boolean);
  const malos = lineas.filter((l) => !leerVideo(l));
  return (
    <label className={`field ${className}`}>
      <span>Videos (links de YouTube, Instagram, TikTok o Vimeo, uno por línea)</span>
      <textarea name={name} rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={"https://youtu.be/…\nhttps://www.instagram.com/reel/…"} />
      {lineas.length > 0 && (
        <span className="text-xs" style={{ color: malos.length ? "#dc2626" : "#059669" }}>
          {malos.length ? `No reconozco este link: ${malos[0]}` : `${lineas.length} video(s) listos para mostrarse`}
        </span>
      )}
    </label>
  );
}
