"use client";
import { useState, useTransition } from "react";
import { borrarCliente } from "../actions";

/** Botón "Eliminar" en cada fila del listado de clientes (solo admin), con confirmación en la misma fila. */
export function EliminarFila({ id, codigo, trabajos }: { id: string; codigo: string; trabajos: number }) {
  const [preguntando, setPreguntando] = useState(false);
  const [pendiente, start] = useTransition();
  const [error, setError] = useState(false);

  if (!preguntando) {
    return (
      <button type="button" onClick={() => setPreguntando(true)} className="text-sm text-red-600 hover:underline" aria-label={`Eliminar cliente ${codigo}`}>
        Eliminar
      </button>
    );
  }
  return (
    <span role="alert" className="flex flex-wrap items-center justify-end gap-2 text-sm">
      <span>¿Eliminar {codigo}{trabajos ? ` y sus ${trabajos} trabajo(s)` : ""}?</span>
      <button type="button" disabled={pendiente}
        onClick={() => { setError(false); start(async () => {
          try { await borrarCliente(id); }
          catch (e) { if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e; setError(true); }
        }); }}
        className="rounded-md bg-red-600 px-2.5 py-1 font-medium text-white hover:bg-red-700 disabled:opacity-50">
        {pendiente ? "Borrando…" : "Sí, eliminar"}
      </button>
      <button type="button" disabled={pendiente} onClick={() => setPreguntando(false)} className="btn-ghost !px-2.5 !py-1">No</button>
      {error && <span className="w-full text-right text-red-700">No se pudo borrar. Recargá y probá de nuevo.</span>}
    </span>
  );
}
