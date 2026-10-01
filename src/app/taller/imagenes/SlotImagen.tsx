"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { comprimirImagen } from "@/lib/imagen";
import { urlSitio, type Slot } from "@/lib/imagenes-sitio";
import { guardarImagenSitio } from "./actions";

/** Una foto de la web: se ve cómo queda, y se sube / cambia / quita al instante. */
export function SlotImagen({ slot, inicial }: { slot: Slot; inicial: string | null }) {
  const [path, setPath] = useState(inicial);
  const [estado, setEstado] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const esVideo = slot.tipo === "video";

  async function subir(f?: File | null) {
    if (!f) return;
    if (esVideo ? !f.type.startsWith("video/") : !f.type.startsWith("image/")) { setEstado(`No se pudo subir: elegí ${esVideo ? "un video" : "una foto"}.`); return; }
    if (esVideo && f.size > 45 * 1024 * 1024) { setEstado("No se pudo subir: el video pesa más de 45 MB. Recortalo o exportalo más liviano (1080p o 720p)."); return; }
    setEstado(esVideo ? `Subiendo video (${Math.round(f.size / 1048576)} MB)… puede tardar un poco` : "Subiendo…");
    try {
      const lado = slot.ratio === "1/1" ? 1200 : 2400;
      const ext = esVideo ? (f.name.split(".").pop()?.toLowerCase() || "mp4") : "jpg";
      const nuevo = `${slot.id}/${Date.now()}.${ext}`;
      const cuerpo = esVideo ? f : await comprimirImagen(f, lado, 0.86);
      const { error } = await createClient().storage.from("sitio").upload(nuevo, cuerpo, { contentType: esVideo ? f.type : "image/jpeg", cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      await guardarImagenSitio(slot.id, nuevo);
      setPath(nuevo); setEstado("¡Publicada en la web!");
    } catch (e) {
      setEstado(`No se pudo subir: ${(e as Error).message}`);
    }
  }

  return (
    <div className="space-y-2">
      <label
        className="group relative block cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition"
        style={{ aspectRatio: slot.ratio, borderColor: arrastrando ? "var(--accent)" : "var(--line)", background: "var(--soft)" }}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); subir(e.dataTransfer.files?.[0]); }}
      >
        {path ? (esVideo
            ? <video src={urlSitio(path)!} className="h-full w-full object-cover" autoPlay muted loop playsInline />
            : <img src={urlSitio(path)!} alt="" className="h-full w-full object-cover" />)
          : <span className="absolute inset-0 grid place-items-center p-3 text-center text-sm muted">{esVideo ? "Tocá o arrastrá un video acá" : "Tocá o arrastrá una foto acá"}</span>}
        {path && <span className="absolute inset-0 grid place-items-center bg-black/50 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100">{esVideo ? "Cambiar video" : "Cambiar foto"}</span>}
        <input type="file" accept={esVideo ? "video/mp4,video/webm,video/quicktime" : "image/*"} className="hidden" onChange={(e) => { subir(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{slot.titulo}</p>
          <p className="muted text-xs">{slot.ayuda}</p>
        </div>
        {path && (
          <button type="button" className="shrink-0 text-xs text-red-600 hover:underline"
            onClick={async () => { if (!confirm(esVideo ? "¿Quitar este video de la web?" : "¿Quitar esta foto de la web?")) return; await guardarImagenSitio(slot.id, null); setPath(null); setEstado("Quitada."); }}>
            Quitar
          </button>
        )}
      </div>
      {estado && <p className="text-xs" style={{ color: estado.startsWith("No") ? "#dc2626" : "#059669" }}>{estado}</p>}
    </div>
  );
}
