"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { comprimirImagen } from "@/lib/imagen";
import { enviarTasacion, prepararFotos, type EstadoTasacion } from "../usados/vender/actions";

export function FormPresupuesto() {
  const [t] = useState(() => Date.now());
  const [fotos, setFotos] = useState<File[]>([]);
  const [estado, setEstado] = useState<EstadoTasacion>(undefined);
  const [paso, setPaso] = useState<string | null>(null);

  if (estado && "ok" in estado) {
    return (
      <div className="card space-y-2">
        <h2 className="text-xl font-semibold">¡Recibido, {estado.nombre}!</h2>
        <p className="muted">Analizamos el presupuesto y te escribimos por WhatsApp con nuestra mejor propuesta.</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("tipo", "presupuesto");
    setEstado(undefined);
    try {
      if (fotos.length) {
        setPaso("Preparando…");
        const prep = await prepararFotos(fotos.length);
        if ("error" in prep) throw new Error(prep.error);
        const sb = createClient();
        for (let i = 0; i < prep.subidas.length; i++) {
          setPaso(`Subiendo ${i + 1} de ${prep.subidas.length}…`);
          const { error } = await sb.storage.from("tasaciones").uploadToSignedUrl(prep.subidas[i].path, prep.subidas[i].token, await comprimirImagen(fotos[i], 2200, 0.88), { contentType: "image/jpeg" });
          if (error) throw new Error("No se pudo subir la foto.");
          fd.append("fotos", prep.subidas[i].path);
        }
        fd.set("carpeta", prep.carpeta);
      }
      setPaso("Enviando…");
      setEstado(await enviarTasacion(fd));
    } catch (err) {
      setEstado({ error: (err as Error).message });
    } finally {
      setPaso(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <input type="hidden" name="t" value={t} />
      <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-2 sm:grid-cols-2">
        {[["producto", "Un instrumento o equipo"], ["reparacion", "Una reparación o service"]].map(([v, l]) => (
          <label key={v} className="flex items-center gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--line)" }}>
            <input type="radio" name="categoria" value={v === "producto" ? "otros" : "servicio"} defaultChecked={v === "producto"} /> {l}
          </label>
        ))}
      </div>
      <label className="field"><span>¿Qué te presupuestaron? *</span><input name="marca" placeholder="Ej.: Fender Player Stratocaster / cambio de trastes" /></label>
      <input type="hidden" name="modelo" value="" />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field"><span>Precio que te pasaron</span><input name="precio_pretendido" placeholder="$ 850.000" /></label>
        <label className="field"><span>¿Dónde? (opcional)</span><input name="interes" placeholder="Tienda o taller" /></label>
      </div>
      <label className="field"><span>Foto o captura del presupuesto</span>
        <input type="file" accept="image/*" multiple onChange={(e) => setFotos(Array.from(e.target.files ?? []).slice(0, 3))} />
      </label>
      <label className="field"><span>Algo más que debamos saber</span><textarea name="descripcion" rows={2} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field"><span>Nombre *</span><input name="nombre" required autoComplete="name" /></label>
        <label className="field"><span>WhatsApp *</span><input name="telefono" required inputMode="tel" autoComplete="tel" /></label>
      </div>
      <input type="hidden" name="quiere" value="vender" />
      {estado && "error" in estado && <p className="text-sm text-red-600">{estado.error}</p>}
      <button className="btn w-full" disabled={!!paso}>{paso ?? "Enviar presupuesto"}</button>
    </form>
  );
}
