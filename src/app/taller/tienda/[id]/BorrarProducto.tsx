"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { borrarProducto } from "../actions";

/** Confirmación dentro de la página (sin ventanitas del navegador, que a veces están bloqueadas). */
function Confirmar({ texto, boton, alConfirmar, alCancelar, pendiente }: {
  texto: string; boton: string; alConfirmar: () => void; alCancelar: () => void; pendiente: boolean;
}) {
  return (
    <span role="alert" className="inline-flex flex-wrap items-center gap-2 text-sm">
      <span>{texto}</span>
      <button type="button" disabled={pendiente} onClick={alConfirmar}
        className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-50">
        {pendiente ? "Borrando…" : boton}
      </button>
      <button type="button" disabled={pendiente} onClick={alCancelar} className="btn-ghost !py-1.5">Cancelar</button>
    </span>
  );
}

/** Botón Borrar / Descartar (antes borraba sin preguntar). */
export function BorrarProducto({ id, borrador }: { id: string; borrador: boolean }) {
  const [pendiente, iniciar] = useTransition();
  const [preguntando, setPreguntando] = useState(false);
  if (preguntando) {
    return (
      <Confirmar pendiente={pendiente}
        texto={borrador ? "¿Descartar este producto nuevo?" : "¿Borrar el producto y sus fotos? No se puede deshacer."}
        boton={borrador ? "Sí, descartar" : "Sí, borrar"}
        alConfirmar={() => iniciar(() => borrarProducto(id))} alCancelar={() => setPreguntando(false)} />
    );
  }
  return (
    <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => setPreguntando(true)}>
      {borrador ? "Descartar" : "Borrar"}
    </button>
  );
}

/** "← Tienda": si el producto nunca se guardó, ofrece descartarlo antes de salir. */
export function VolverTienda({ id, borrador }: { id: string; borrador: boolean }) {
  const [pendiente, iniciar] = useTransition();
  const [preguntando, setPreguntando] = useState(false);
  if (preguntando) {
    return (
      <Confirmar pendiente={pendiente} texto="Este producto no se guardó." boton="Descartar y volver"
        alConfirmar={() => iniciar(() => borrarProducto(id))} alCancelar={() => setPreguntando(false)} />
    );
  }
  return (
    <Link href="/taller/tienda" className="muted text-sm hover:underline"
      onClick={(e) => { if (borrador) { e.preventDefault(); setPreguntando(true); } }}>
      ← Tienda
    </Link>
  );
}
