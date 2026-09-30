"use client";

import { borrarAvance } from "@/app/taller/actions";

export function BorrarAvance({ id, trabajoId }: { id: string; trabajoId: string }) {
  return (
    <button
      type="button"
      className="text-xs text-red-600 hover:underline"
      onClick={async () => {
        if (confirm("¿Borrar este avance?")) await borrarAvance(id, trabajoId);
      }}
    >
      Borrar
    </button>
  );
}
