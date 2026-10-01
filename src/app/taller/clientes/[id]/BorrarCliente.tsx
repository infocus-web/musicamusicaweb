"use client";
import { useState, useTransition } from "react";
import { borrarCliente } from "../../actions";

export function BorrarCliente({ id, nombre, codigo, trabajos }: { id: string; nombre: string; codigo: string; trabajos: number }) {
  const [pendiente, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function borrar() {
    const aviso = trabajos
      ? `Vas a borrar a ${nombre} (${codigo}) junto con sus ${trabajos} trabajo(s), instrumentos y todas las fotos y videos de avances.`
      : `Vas a borrar a ${nombre} (${codigo}) y sus instrumentos.`;
    const escrito = prompt(`${aviso}\n\nNo se puede deshacer. Para confirmar, escribí el código del cliente: ${codigo}`);
    if (escrito == null) return;
    if (escrito.trim().toUpperCase() !== codigo.toUpperCase()) { setError("El código no coincide; no se borró nada."); return; }
    setError(null);
    start(async () => {
      try { await borrarCliente(id); }
      catch (e) { if (!(e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) setError((e as Error).message); else throw e; }
    });
  }

  return (
    <section className="card space-y-2" style={{ borderColor: "#fecaca" }}>
      <h2 className="font-semibold text-red-700">Eliminar cliente</h2>
      <p className="muted text-sm">Borra al cliente, sus instrumentos, trabajos, fotos/videos de avances y su acceso. Los pedidos de la tienda y las reseñas quedan guardados.</p>
      <button type="button" onClick={borrar} disabled={pendiente} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
        {pendiente ? "Borrando…" : "Eliminar cliente"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
