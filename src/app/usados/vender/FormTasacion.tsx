"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { comprimirImagen } from "@/lib/imagen";
import { CATEGORIAS_USADOS, CONDICIONES } from "@/lib/usados";
import { enviarTasacion, prepararFotos, type EstadoTasacion } from "./actions";

export function FormTasacion({ permuta }: { permuta?: string }) {
  const [t] = useState(() => Date.now());
  const [fotos, setFotos] = useState<File[]>([]);
  const [estado, setEstado] = useState<EstadoTasacion>(undefined);
  const [paso, setPaso] = useState<string | null>(null);

  if (estado && "ok" in estado) {
    return (
      <div className="card space-y-2">
        <h2 className="text-xl font-semibold">¡Gracias, {estado.nombre}!</h2>
        <p className="muted">Recibimos tu instrumento. Lo miramos y te escribimos por WhatsApp con una tasación.</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setEstado(undefined);
    try {
      if (fotos.length) {
        setPaso("Preparando fotos…");
        const prep = await prepararFotos(fotos.length);
        if ("error" in prep) throw new Error(prep.error);
        const sb = createClient();
        for (let i = 0; i < prep.subidas.length; i++) {
          setPaso(`Subiendo foto ${i + 1} de ${prep.subidas.length}…`);
          const blob = await comprimirImagen(fotos[i]);
          const { error } = await sb.storage.from("tasaciones").uploadToSignedUrl(prep.subidas[i].path, prep.subidas[i].token, blob, { contentType: "image/jpeg" });
          if (error) throw new Error("No se pudo subir una foto.");
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

      <fieldset className="space-y-3">
        <legend className="font-semibold">¿Qué querés hacer?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["vender", "Vendérselo al taller"],
            ["permutar", "Entregarlo en parte de pago"],
            ["consignar", "Dejarlo en consignación"],
          ].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--line)" }}>
              <input type="radio" name="quiere" value={v} defaultChecked={permuta ? v === "permutar" : v === "vender"} /> {l}
            </label>
          ))}
        </div>
        <label className="field"><span>Si es permuta, ¿qué te interesa?</span><input name="interes" defaultValue={permuta ? `El usado ${permuta}` : ""} placeholder="Ej.: el usado U-012, un bajo de 5 cuerdas…" /></label>
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        <legend className="col-span-2 font-semibold">Tu instrumento</legend>
        <label className="field col-span-2"><span>Tipo</span>
          <select name="categoria" defaultValue="guitarras">{CATEGORIAS_USADOS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        </label>
        <label className="field"><span>Marca *</span><input name="marca" /></label>
        <label className="field"><span>Modelo</span><input name="modelo" /></label>
        <label className="field"><span>Año (aprox.)</span><input name="anio" inputMode="numeric" /></label>
        <label className="field"><span>Estado</span>
          <select name="condicion" defaultValue="muy_bueno">{CONDICIONES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        </label>
        <label className="field col-span-2"><span>Contanos más (modificaciones, detalles, qué incluye)</span><textarea name="descripcion" rows={3} /></label>
        <label className="field col-span-2"><span>¿Cuánto pretendés? (opcional)</span><input name="precio_pretendido" /></label>
        <label className="field col-span-2">
          <span>Fotos (hasta 6: frente, dorso, detalles)</span>
          <input type="file" accept="image/*" multiple onChange={(e) => setFotos(Array.from(e.target.files ?? []).slice(0, 6))} />
        </label>
        {fotos.length > 0 && <p className="col-span-2 muted text-xs">{fotos.length} foto(s) elegida(s). Las achicamos antes de subirlas.</p>}
      </fieldset>

      <fieldset className="grid gap-3 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        <legend className="font-semibold">Tus datos</legend>
        <label className="field"><span>Nombre *</span><input name="nombre" required autoComplete="name" /></label>
        <label className="field"><span>WhatsApp *</span><input name="telefono" required inputMode="tel" autoComplete="tel" /></label>
        <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" /></label>
      </fieldset>

      {estado && "error" in estado && <p className="text-sm text-red-600">{estado.error}</p>}
      <button className="btn w-full" disabled={!!paso}>{paso ?? "Pedir tasación"}</button>
    </form>
  );
}
