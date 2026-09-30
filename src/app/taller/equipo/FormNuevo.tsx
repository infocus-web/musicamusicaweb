"use client";

import { useActionState } from "react";
import { crearIntegrante } from "./actions";
import { InputClave } from "@/components/InputClave";

export function FormNuevo() {
  const [estado, accion, pendiente] = useActionState(crearIntegrante, undefined);
  return (
    <form action={accion} className="card space-y-3">
      <h2 className="text-lg font-semibold">Agregar al equipo</h2>
      <label className="field"><span>Nombre</span><input name="nombre" required /></label>
      <label className="field"><span>Email (es su usuario)</span><input name="email" type="email" required autoComplete="off" /></label>
      <label className="field"><span>Clave inicial (mín. 8)</span><InputClave name="clave" minLength={8} required autoComplete="new-password" /></label>
      <label className="field"><span>Rol</span>
        <select name="rol" defaultValue="tecnico">
          <option value="tecnico">Técnico</option>
          <option value="admin">Administrador</option>
        </select>
      </label>
      <p className="muted text-xs">Técnico: trabaja con clientes, órdenes y avances. Administrador: además maneja el equipo.</p>
      {estado?.error && <p className="text-sm text-red-600">{estado.error}</p>}
      {estado?.ok && <p className="text-sm text-emerald-600">{estado.ok}</p>}
      <button className="btn w-full" disabled={pendiente}>{pendiente ? "Creando…" : "Crear acceso"}</button>
    </form>
  );
}
