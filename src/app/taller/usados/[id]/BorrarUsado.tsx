"use client";

import { borrarUsado } from "../actions";

export function BorrarUsado({ id }: { id: string }) {
  return (
    <button type="button" className="text-sm text-red-600 hover:underline"
      onClick={async () => { if (confirm("¿Borrar esta publicación y sus fotos? No se puede deshacer.")) await borrarUsado(id); }}>
      Borrar publicación
    </button>
  );
}
