"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { comprimirImagen } from "@/lib/imagen";

/** Sube la foto del banner principal; guarda la ruta en un input oculto del formulario de Ajustes. */
export function ImagenBanner({ inicial }: { inicial: string | null }) {
  const [path, setPath] = useState(inicial ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const url = path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sitio/${path}` : null;
  return (
    <div className="space-y-2 sm:col-span-2">
      <input type="hidden" name="hero_imagen" value={path} />
      <span className="muted text-sm">Foto del banner (horizontal, ideal 2000×900: el taller, un instrumento, tu banco de trabajo)</span>
      {url && <img src={url} alt="" className="aspect-[21/9] w-full rounded-xl object-cover" />}
      <div className="flex flex-wrap items-center gap-2">
        <label className="btn-ghost cursor-pointer">
          {path ? "Cambiar foto" : "Subir foto"}
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            setMsg("Subiendo…");
            const p = `banner/${Date.now()}.jpg`;
            const { error } = await createClient().storage.from("sitio").upload(p, await comprimirImagen(f, 2400, 0.85), { contentType: "image/jpeg", cacheControl: "31536000" });
            if (error) { setMsg(`Error: ${error.message}`); return; }
            setPath(p); setMsg("Lista. Tocá Guardar ajustes para publicarla.");
          }} />
        </label>
        {path && <button type="button" className="text-sm text-red-600" onClick={() => setPath("")}>Quitar foto</button>}
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </div>
  );
}
