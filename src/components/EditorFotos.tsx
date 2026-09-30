"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { comprimirImagen } from "@/lib/imagen";

/** Subir, ordenar y quitar fotos de un bucket público. `guardar` es una Server Action ya ligada al registro. */
export function EditorFotos({ carpeta, bucket, iniciales, guardar }: { carpeta: string; bucket: string; iniciales: string[]; guardar: (fotos: string[]) => Promise<void> }) {
  const [fotos, setFotos] = useState(iniciales);
  const [msg, setMsg] = useState<string | null>(null);
  const url = (p: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${p}`;
  const set = async (n: string[]) => { setFotos(n); await guardar(n); };

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []); e.target.value = "";
    const sb = createClient(); const nuevas: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setMsg(`Subiendo ${i + 1} de ${files.length}…`);
      const path = `${carpeta}/${Date.now()}-${i}.jpg`;
      const { error } = await sb.storage.from(bucket).upload(path, await comprimirImagen(files[i], 2200, 0.88), { contentType: "image/jpeg", cacheControl: "31536000" });
      if (error) { setMsg(`Error: ${error.message}`); return; }
      nuevas.push(path);
    }
    await set([...fotos, ...nuevas]); setMsg(null);
  }
  const mover = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= fotos.length) return; const n = [...fotos]; [n[i], n[j]] = [n[j], n[i]]; set(n); };

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Fotos</h2>
        <label className="btn cursor-pointer">+ Agregar<input type="file" accept="image/*" multiple className="hidden" onChange={subir} /></label>
      </div>
      <p className="muted text-xs">La primera es la portada. Ideal: fondo blanco, producto centrado.</p>
      {msg && <p className="text-sm">{msg}</p>}
      <ul className="grid grid-cols-3 gap-2">
        {fotos.map((f, i) => (
          <li key={f} className="space-y-1">
            <img src={url(f)} alt="" className="aspect-square w-full rounded-lg bg-white object-contain" />
            <div className="flex justify-between text-xs">
              <button type="button" className="link" onClick={() => mover(i, -1)} disabled={i === 0}>←</button>
              <button type="button" className="text-red-600" onClick={() => confirm("¿Quitar la foto?") && set(fotos.filter((x) => x !== f))}>Quitar</button>
              <button type="button" className="link" onClick={() => mover(i, 1)} disabled={i === fotos.length - 1}>→</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
