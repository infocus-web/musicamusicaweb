"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { comprimirImagen } from "@/lib/imagen";
import { fotoUsado } from "@/lib/usados";
import { guardarFotos } from "../actions";

export function Fotos({ id, iniciales }: { id: string; iniciales: string[] }) {
  const [fotos, setFotos] = useState(iniciales);
  const actual = useRef(iniciales);          // siempre la lista más nueva (evita pisar fotos)
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function guardar(nuevas: string[], quitar: string[] = []) {
    setOcupado(true);
    actual.current = nuevas; setFotos(nuevas);
    try {
      const final = await guardarFotos(id, nuevas, quitar);
      actual.current = final; setFotos(final);
      setMsg("✓ Fotos guardadas");
      setTimeout(() => setMsg((m) => (m === "✓ Fotos guardadas" ? null : m)), 2500);
    } catch (e) {
      setMsg(`No se pudo guardar: ${(e as Error).message}`);
    } finally { setOcupado(false); }
  }

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 20);
    e.target.value = "";
    if (!files.length) return;
    setOcupado(true);
    const sb = createClient();
    const agregadas: string[] = [];
    let error: string | null = null;
    for (let i = 0; i < files.length; i++) {
      setMsg(`Subiendo ${i + 1} de ${files.length}…`);
      try {
        const blob = await comprimirImagen(files[i], 2200, 0.88);
        const path = `${id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;
        const r = await sb.storage.from("usados").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
        if (r.error) { error = r.error.message; break; }
        agregadas.push(path);
      } catch (err) { error = (err as Error).message; break; }
    }
    // Guardamos lo que se haya subido, aunque alguna falle.
    if (agregadas.length) await guardar([...actual.current, ...agregadas]);
    else setOcupado(false);
    if (error) setMsg(`Se subieron ${agregadas.length} de ${files.length}. Error: ${error}`);
  }

  const mover = (i: number, d: number) => {
    const n = [...actual.current]; const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    guardar(n);
  };

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Fotos ({fotos.length})</h2>
        <label className={`btn ${ocupado ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
          {ocupado ? "Esperá…" : "+ Agregar fotos"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={subir} disabled={ocupado} />
        </label>
      </div>
      <p className="muted text-xs">Podés elegir varias fotos a la vez (hasta 20) o ir agregando de a una. Se guardan solas, no hace falta tocar “Guardar”. La primera es la portada.</p>
      {msg && <p className="text-sm font-medium" style={{ color: msg.startsWith("✓") ? "#15803d" : undefined }}>{msg}</p>}
      {fotos.length === 0 && <p className="muted text-sm">Todavía no hay fotos.</p>}
      <ul className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${ocupado ? "opacity-60" : ""}`}>
        {fotos.map((f, i) => (
          <li key={f} className="space-y-1">
            <div className="relative overflow-hidden rounded-lg" style={{ background: "var(--line)" }}>
              <img src={fotoUsado(f)!} alt="" className="aspect-[4/3] w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 badge bg-black/70 text-white">Portada</span>}
            </div>
            <div className="flex justify-between text-xs">
              <button type="button" onClick={() => mover(i, -1)} disabled={ocupado || i === 0} className="link disabled:opacity-30">← Antes</button>
              {i !== 0 && <button type="button" disabled={ocupado} onClick={() => guardar([f, ...actual.current.filter((x) => x !== f)])} className="link">Portada</button>}
              <button type="button" onClick={() => mover(i, 1)} disabled={ocupado || i === fotos.length - 1} className="link disabled:opacity-30">Después →</button>
            </div>
            <button type="button" disabled={ocupado} onClick={() => confirm("¿Quitar esta foto?") && guardar(actual.current.filter((x) => x !== f), [f])} className="w-full text-xs text-red-600 hover:underline">Quitar</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
