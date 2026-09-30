"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { comprimirImagen } from "@/lib/imagen";

/** Subir, ordenar y quitar fotos de un bucket público. `guardar` es una Server Action ya ligada al registro. */
export function EditorFotos({ carpeta, bucket, iniciales, guardar }: {
  carpeta: string; bucket: string; iniciales: string[];
  guardar: (fotos: string[], quitar?: string[]) => Promise<string[]>;
}) {
  const [fotos, setFotos] = useState(iniciales);
  const actual = useRef(iniciales);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const url = (p: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${p}`;

  const set = async (n: string[], quitar: string[] = []) => {
    setOcupado(true); actual.current = n; setFotos(n);
    try {
      const final = await guardar(n, quitar);
      actual.current = final; setFotos(final);
      setMsg("✓ Fotos guardadas");
      setTimeout(() => setMsg((m) => (m === "✓ Fotos guardadas" ? null : m)), 2500);
    } catch (e) { setMsg(`No se pudo guardar: ${(e as Error).message}`); }
    finally { setOcupado(false); }
  };

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 15); e.target.value = "";
    if (!files.length) return;
    setOcupado(true);
    const sb = createClient(); const nuevas: string[] = []; let error: string | null = null;
    for (let i = 0; i < files.length; i++) {
      setMsg(`Subiendo ${i + 1} de ${files.length}…`);
      try {
        const path = `${carpeta}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;
        const r = await sb.storage.from(bucket).upload(path, await comprimirImagen(files[i], 2200, 0.88), { contentType: "image/jpeg", cacheControl: "31536000" });
        if (r.error) { error = r.error.message; break; }
        nuevas.push(path);
      } catch (err) { error = (err as Error).message; break; }
    }
    if (nuevas.length) await set([...actual.current, ...nuevas]); else setOcupado(false);
    if (error) setMsg(`Se subieron ${nuevas.length} de ${files.length}. Error: ${error}`);
  }
  const mover = (i: number, d: number) => { const n = [...actual.current]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; set(n); };

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Fotos ({fotos.length})</h2>
        <label className={`btn ${ocupado ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>{ocupado ? "Esperá…" : "+ Agregar"}<input type="file" accept="image/*" multiple className="hidden" onChange={subir} disabled={ocupado} /></label>
      </div>
      <p className="muted text-xs">Podés elegir varias a la vez. Se guardan solas. La primera es la portada. Ideal: fondo blanco, producto centrado.</p>
      {msg && <p className="text-sm font-medium" style={{ color: msg.startsWith("✓") ? "#15803d" : undefined }}>{msg}</p>}
      <ul className={`grid grid-cols-3 gap-2 ${ocupado ? "opacity-60" : ""}`}>
        {fotos.map((f, i) => (
          <li key={f} className="space-y-1">
            <img src={url(f)} alt="" className="aspect-square w-full rounded-lg bg-white object-contain" />
            <div className="flex justify-between text-xs">
              <button type="button" className="link" onClick={() => mover(i, -1)} disabled={ocupado || i === 0}>←</button>
              <button type="button" className="text-red-600" disabled={ocupado} onClick={() => confirm("¿Quitar la foto?") && set(actual.current.filter((x) => x !== f), [f])}>Quitar</button>
              <button type="button" className="link" onClick={() => mover(i, 1)} disabled={ocupado || i === fotos.length - 1}>→</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
