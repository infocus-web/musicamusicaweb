"use client";

import { useActionState, useState } from "react";
import { cambiarClaveIntegrante, cambiarRol, quitarAcceso } from "./actions";
import { InputClave } from "@/components/InputClave";

type Props = { userId: string; nombre: string | null; email: string | null; rol: string; esYo: boolean; duenio: boolean };

export function FilaIntegrante({ userId, nombre, email, rol, esYo, duenio }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, pendiente] = useActionState(cambiarClaveIntegrante.bind(null, userId), undefined);

  return (
    <li className="space-y-3 rounded-xl border p-4" style={{ borderColor: "var(--line)" }}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <p className="font-medium">{nombre ?? "Sin nombre"} {esYo && <span className="muted text-xs">(vos)</span>} {duenio && <span className="badge bg-amber-100 text-amber-800">Cuenta principal</span>}</p>
          <p className="muted text-sm">{email}</p>
        </div>
        {esYo || duenio ? (
          <span className="badge bg-zinc-200 text-zinc-700">{rol === "admin" ? "Administrador" : "Técnico"}</span>
        ) : (
          <form action={cambiarRol.bind(null, userId)} className="flex gap-2">
            <select name="rol" defaultValue={rol} className="rounded-lg border px-2 py-1 text-sm" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
              <option value="tecnico">Técnico</option>
              <option value="admin">Administrador</option>
            </select>
            <button className="btn-ghost !px-3 !py-1">Guardar</button>
          </form>
        )}
        {(esYo || !duenio) && <button type="button" className="text-sm link" onClick={() => setAbierto(!abierto)}>Cambiar clave</button>}
        {!esYo && !duenio && (
          <button
            type="button"
            className="text-sm text-red-600 hover:underline"
            onClick={async () => {
              if (confirm(`¿Quitarle el acceso a ${nombre ?? email}? No va a poder entrar más.`)) await quitarAcceso(userId);
            }}
          >
            Quitar acceso
          </button>
        )}
      </div>
      {abierto && (
        <form action={accion} className="flex flex-wrap items-end gap-2">
          <label className="field flex-1"><span>Clave nueva (mín. 8)</span><InputClave name="clave" minLength={8} required autoComplete="new-password" /></label>
          <button className="btn" disabled={pendiente}>Guardar clave</button>
          {estado?.error && <p className="w-full text-sm text-red-600">{estado.error}</p>}
          {estado?.ok && <p className="w-full text-sm text-emerald-600">{estado.ok}</p>}
        </form>
      )}
    </li>
  );
}
