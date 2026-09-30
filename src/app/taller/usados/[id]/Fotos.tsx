"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { comprimirImagen } from "@/lib/imagen";
import { fotoUsado } from "@/lib/usados";
import { guardarFotos } from "../actions";

export function Fotos({ id, iniciales }: { id: string; iniciales: string[] }) {
  const [fotos, setFotos] = useState(iniciales);
  const [msg, setMsg] = useState<string | null>(null);

  async function guardar(nuevas: string[]) {
    setFotos(nuevas);
    await guardarFotos(id, nuevas);
  }

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const sb = createClient();
    const agregadas: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setMsg(`Subiendo ${i + 1} de ${files.length}…`);
      const blob = await comprimirImagen(files[i], 2200, 0.88);
      const path = `${id}/${Date.now()}-${crypto.randomUUID().slice(0, 6)}.jpg`;
      const { error } = await sb.storage.from("usados").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (error) { setMsg(`Error: ${error.message}`); return; }
      agregadas.push(path);
    }
    await guardar([...fotos, ...agregadas]);
    setMsg(null);
  }

  const mover = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= fotos.length) return;
    const n = [...fotos];
    [n[i], n[j]] = [n[j], n[i]];
    guardar(n);
  };

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Fotos</h2>
        <label className="btn cursor-pointer">
          + Agregar fotos
          <input type="file" accept="image/*" multiple className="hidden" onChange={subir} />
        </label>
      </div>
      <p className="muted text-xs">La primera es la portada. Se achican solas antes de subir.</p>
      {msg && <p className="text-sm">{msg}</p>}
      {fotos.length === 0 && <p className="muted text-sm">Todavía no hay fotos.</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fotos.map((f, i) => (
          <li key={f} className="space-y-1">
            <div className="relative overflow-hidden rounded-lg" style={{ background: "var(--line)" }}>
              <img src={fotoUsado(f)!} alt="" className="aspect-[4/3] w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 badge bg-black/70 text-white">Portada</span>}
            </div>
            <div className="flex justify-between text-xs">
              <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className="link disabled:opacity-30">← Antes</button>
              {i !== 0 && <button type="button" onClick={() => guardar([f, ...fotos.filter((x) => x !== f)])} className="link">Portada</button>}
              <button type="button" onClick={() => mover(i, 1)} disabled={i === fotos.length - 1} className="link disabled:opacity-30">Después →</button>
            </div>
            <button type="button" onClick={() => confirm("¿Quitar esta foto?") && guardar(fotos.filter((x) => x !== f))} className="w-full text-xs text-red-600 hover:underline">Quitar</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
