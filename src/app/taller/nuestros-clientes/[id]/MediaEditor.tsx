"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { comprimirImagen } from "@/lib/imagen";
import { urlCaso, type MediaCaso } from "@/lib/casos";
import { guardarMediaCaso } from "../actions";

export function MediaEditor({ id, inicial }: { id: string; inicial: MediaCaso[] }) {
  const [media, setMedia] = useState(inicial);
  const actual = useRef(inicial);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const guardar = async (m: MediaCaso[], quitar: string[] = []) => {
    setOcupado(true); actual.current = m; setMedia(m);
    try {
      const final = await guardarMediaCaso(id, m, quitar);
      actual.current = final; setMedia(final);
      setMsg("✓ Guardado");
      setTimeout(() => setMsg((x) => (x === "✓ Guardado" ? null : x)), 2500);
    } catch (e) { setMsg(`No se pudo guardar: ${(e as Error).message}`); }
    finally { setOcupado(false); }
  };

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setOcupado(true);
    const sb = createClient();
    const nuevas: MediaCaso[] = [];
    let error: string | null = null;
    for (let i = 0; i < files.length; i++) {
      setMsg(`Subiendo ${i + 1} de ${files.length}…`);
      const esVideo = files[i].type.startsWith("video");
      const cuerpo = esVideo ? files[i] : await comprimirImagen(files[i], 2000, 0.85);
      const ext = esVideo ? files[i].name.split(".").pop()?.toLowerCase() || "mp4" : "jpg";
      const path = `${id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const r = await sb.storage.from("casos").upload(path, cuerpo, { contentType: esVideo ? files[i].type : "image/jpeg" });
      if (r.error) { error = r.error.message; break; }
      nuevas.push({ path, tipo: esVideo ? "video" : "foto" });
    }
    if (nuevas.length) await guardar([...actual.current, ...nuevas]); else setOcupado(false);
    if (error) setMsg(`Se subieron ${nuevas.length} de ${files.length}. Error: ${error}`);
  }

  const mover = (i: number, d: number) => {
    const n = [...actual.current]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; guardar(n);
  };

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Fotos y videos</h2>
        <label className={`btn ${ocupado ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>{ocupado ? "Esperá…" : "+ Agregar"}<input type="file" accept="image/*,video/*" multiple className="hidden" onChange={subir} disabled={ocupado} /></label>
      </div>
      <p className="muted text-xs">Tip: poné primero el “antes” y después el “después”. La primera foto es la portada.</p>
      {msg && <p className="text-sm font-medium" style={{ color: msg.startsWith("✓") ? "#15803d" : undefined }}>{msg}</p>}
      <ul className="grid grid-cols-2 gap-3">
        {media.map((m, i) => (
          <li key={m.path} className="space-y-1">
            {m.tipo === "video"
              ? <video src={urlCaso(m.path)} className="aspect-[4/3] w-full rounded-lg bg-black object-cover" muted playsInline />
              : <img src={urlCaso(m.path)} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />}
            <div className="flex justify-between text-xs">
              <button type="button" onClick={() => mover(i, -1)} className="link" disabled={ocupado || i === 0}>←</button>
              <button type="button" disabled={ocupado} onClick={() => confirm("¿Quitar?") && guardar(actual.current.filter((x) => x.path !== m.path), [m.path])} className="text-red-600">Quitar</button>
              <button type="button" onClick={() => mover(i, 1)} className="link" disabled={ocupado || i === media.length - 1}>→</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
