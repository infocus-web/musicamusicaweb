"use client";
import { useActionState } from "react";
import { ponerClave } from "@/app/mi-cuenta/panel/actions";
import { InputClave } from "@/components/InputClave";

export function FormClave({ token, tieneClave, usuario }: { token: string | null; tieneClave: boolean; usuario: string }) {
  const [estado, accion, pendiente] = useActionState(ponerClave.bind(null, token), undefined);
  return (
    <form action={accion} className="card space-y-3">
      <h2 className="font-semibold">{tieneClave ? "Cambiar mi clave" : "Crear mi clave"}</h2>
      <p className="muted text-sm">Con la clave podés entrar desde cualquier lado en <b>musicamusicaweb.com.ar/mi-cuenta</b> usando <b>{usuario}</b>.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field"><span>Clave nueva (mín. 6)</span><InputClave name="clave" minLength={6} required autoComplete="new-password" /></label>
        <label className="field"><span>Repetila</span><InputClave name="clave2" minLength={6} required autoComplete="new-password" /></label>
      </div>
      {estado?.error && <p role="alert" className="text-sm text-red-600">{estado.error}</p>}
      {estado?.ok && <p role="status" className="text-sm font-medium" style={{ color: "#15803d" }}>✓ Clave guardada.</p>}
      <button className="btn" disabled={pendiente}>{pendiente ? "Guardando…" : "Guardar clave"}</button>
    </form>
  );
}
