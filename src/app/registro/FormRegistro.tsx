"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registrarCliente } from "./actions";
import { TIPOS_INSTRUMENTO } from "@/lib/estados";

export function FormRegistro() {
  const [estado, accion, pendiente] = useActionState(registrarCliente, undefined);
  const [t] = useState(() => Date.now());
  const [conInstrumento, setConInstrumento] = useState(true);

  if (estado && "ok" in estado) {
    if (!estado.nuevo) {
      return (
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">¡Hola {estado.nombre}! Ya estabas registrado</h2>
          <p className="muted">Ese teléfono ya figura en el taller. Si necesitás tu código o tu link, escribinos por WhatsApp y te lo mandamos.</p>
        </div>
      );
    }
    return (
      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">¡Listo, {estado.nombre}! Ya estás registrado</h2>
        <div className="rounded-xl p-4" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
          <p className="muted text-sm">Tu código de cliente</p>
          <p className="font-mono text-3xl tracking-widest">{estado.codigo}</p>
        </div>
        <p className="text-sm">Guardá este link: ahí vas a ver el avance de tus instrumentos cuando los traigas al taller.</p>
        <a href={estado.link} className="btn w-full">Abrir mi seguimiento</a>
        {estado.conClave && (
          <p className="muted text-sm">También podés entrar en <Link className="link" href="/mi-cuenta">Mi cuenta</Link> con tu código y la clave que elegiste.</p>
        )}
      </div>
    );
  }

  return (
    <form action={accion} className="card space-y-4">
      <input type="hidden" name="t" value={t} />
      {/* Campo trampa para bots: las personas no lo ven */}
      <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <fieldset className="space-y-3">
        <legend className="font-semibold">Tus datos</legend>
        <label className="field"><span>Nombre y apellido *</span><input name="nombre" required autoComplete="name" /></label>
        <label className="field"><span>Teléfono / WhatsApp *</span><input name="telefono" required inputMode="tel" autoComplete="tel" placeholder="11 2345 6789" /></label>
        <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" /></label>
      </fieldset>

      <fieldset className="space-y-3 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        <legend className="flex w-full items-center justify-between font-semibold">
          <span>Tu instrumento</span>
          <label className="flex items-center gap-2 text-sm font-normal muted">
            <input type="checkbox" checked={!conInstrumento} onChange={(e) => setConInstrumento(!e.target.checked)} /> Lo cargo después
          </label>
        </legend>
        {conInstrumento && (
          <div className="grid grid-cols-2 gap-3">
            <label className="field col-span-2"><span>Tipo</span>
              <select name="tipo" defaultValue="">
                <option value="" disabled>Elegí…</option>
                {TIPOS_INSTRUMENTO.map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
            <label className="field"><span>Marca</span><input name="marca" /></label>
            <label className="field"><span>Modelo</span><input name="modelo" /></label>
            <label className="field col-span-2"><span>N° de serie (si lo sabés)</span><input name="numero_serie" /></label>
          </div>
        )}
        <label className="field"><span>¿Qué necesitás? (opcional)</span><textarea name="notas" rows={2} placeholder="Ej.: puesta a punto, le zumba una cuerda…" /></label>
      </fieldset>

      <fieldset className="space-y-3 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        <legend className="font-semibold">Clave para Mi cuenta (opcional)</legend>
        <label className="field"><span>Elegí una clave (mín. 6)</span><input name="clave" type="password" minLength={6} autoComplete="new-password" /></label>
        <p className="muted text-xs">Si no la cargás, igual te damos un link privado para seguir tus trabajos.</p>
      </fieldset>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="acepto" required className="mt-1" />
        <span>Acepto que Música Música Web guarde estos datos para contactarme por mis trabajos en el taller.</span>
      </label>

      {estado && "error" in estado && <p className="text-sm text-red-600">{estado.error}</p>}
      <button className="btn w-full" disabled={pendiente}>{pendiente ? "Enviando…" : "Registrarme"}</button>
    </form>
  );
}
