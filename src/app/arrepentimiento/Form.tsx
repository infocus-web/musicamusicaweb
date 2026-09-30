"use client";

import { useActionState } from "react";
import { pedirArrepentimiento } from "./actions";

export function FormArrepentimiento() {
  const [estado, accion, pendiente] = useActionState(pedirArrepentimiento, undefined);
  if (estado && "codigo" in estado) {
    return (
      <div className="card space-y-3">
        <h2 className="text-xl font-semibold">Recibimos tu pedido</h2>
        <p>Tu código de trámite es:</p>
        <p className="font-mono text-3xl tracking-widest">{estado.codigo}</p>
        <p className="muted text-sm">Guardalo. Te contactamos dentro de las 24 h para coordinar la devolución.</p>
      </div>
    );
  }
  return (
    <form action={accion} className="card space-y-3">
      <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="field"><span>Nombre y apellido *</span><input name="nombre" required /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field"><span>Email</span><input name="email" type="email" /></label>
        <label className="field"><span>Teléfono</span><input name="telefono" inputMode="tel" /></label>
      </div>
      <label className="field"><span>N° de pedido, orden de trabajo o producto</span><input name="referencia" placeholder="Ej.: OT-00012 o pedido del 3/10" /></label>
      <label className="field"><span>Comentarios (opcional)</span><textarea name="detalle" rows={3} /></label>
      {estado && "error" in estado && <p className="text-sm text-red-600">{estado.error}</p>}
      <button className="btn w-full" disabled={pendiente}>{pendiente ? "Enviando…" : "Quiero arrepentirme de mi compra"}</button>
    </form>
  );
}
