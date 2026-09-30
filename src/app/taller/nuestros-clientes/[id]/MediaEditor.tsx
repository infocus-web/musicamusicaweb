"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { comprimirImagen } from "@/lib/imagen";
import { urlCaso, type MediaCaso } from "@/lib/casos";
import { guardarMediaCaso } from "../actions";

export function MediaEditor({ id, inicial }: { id: string; inicial: MediaCaso[] }) {
  const [media, setMedia] = useState(inicial);
  const [msg, setMsg] = useState<string | null>(null);
  const guardar = async (m: MediaCaso[]) => { setMedia(m); await guardarMediaCaso(id, m); };

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const sb = createClient();
    const nuevas: MediaCaso[] = [];
    for (let i = 0; i < files.length; i++) {
      setMsg(`Subiendo ${i + 1} de ${files.length}…`);
      const esVideo = files[i].type.startsWith("video");
      const cuerpo = esVideo ? files[i] : await comprimirImagen(files[i], 2000, 0.85);
      const ext = esVideo ? files[i].name.split(".").pop()?.toLowerCase() || "mp4" : "jpg";
      const path = `${id}/${Date.now()}-${i}.${ext}`;
      const { error } = await sb.storage.from("casos").upload(path, cuerpo, { contentType: esVideo ? files[i].type : "image/jpeg" });
      if (error) { setMsg(`Error: ${error.message}`); return; }
      nuevas.push({ path, tipo: esVideo ? "video" : "foto" });
    }
    await guardar([...media, ...nuevas]);
    setMsg(null);
  }

  const mover = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= media.length) return;
    const n = [...media]; [n[i], n[j]] = [n[j], n[i]]; guardar(n);
  };

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Fotos y videos</h2>
        <label className="btn cursor-pointer">+ Agregar<input type="file" accept="image/*,video/*" multiple className="hidden" onChange={subir} /></label>
      </div>
      <p className="muted text-xs">Tip: poné primero el “antes” y después el “después”. La primera foto es la portada.</p>
      {msg && <p className="text-sm">{msg}</p>}
      <ul className="grid grid-cols-2 gap-3">
        {media.map((m, i) => (
          <li key={m.path} className="space-y-1">
            {m.tipo === "video"
              ? <video src={urlCaso(m.path)} className="aspect-[4/3] w-full rounded-lg bg-black object-cover" muted playsInline />
              : <img src={urlCaso(m.path)} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />}
            <div className="flex justify-between text-xs">
              <button type="button" onClick={() => mover(i, -1)} className="link" disabled={i === 0}>←</button>
              <button type="button" onClick={() => confirm("¿Quitar?") && guardar(media.filter((x) => x.path !== m.path))} className="text-red-600">Quitar</button>
              <button type="button" onClick={() => mover(i, 1)} className="link" disabled={i === media.length - 1}>→</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
