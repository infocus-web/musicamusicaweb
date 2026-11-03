"use client";
import { useState, useTransition } from "react";
import { borrarCliente } from "../../actions";

/**
 * Confirmación dentro de la página (antes usaba la ventanita prompt() del navegador,
 * que algunos navegadores bloquean y entonces el botón "no hacía nada").
 */
export function BorrarCliente({ id, nombre, codigo, trabajos }: { id: string; nombre: string; codigo: string; trabajos: number }) {
  const [pendiente, start] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const [escrito, setEscrito] = useState("");
  const [error, setError] = useState<string | null>(null);
  const coincide = escrito.trim().toUpperCase() === codigo.toUpperCase();

  function borrar() {
    if (!coincide) return;
    setError(null);
    start(async () => {
      try { await borrarCliente(id); }
      catch (e) {
        if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
        setError("No se pudo borrar. Recargá la página y probá de nuevo.");
      }
    });
  }

  return (
    <section className="card space-y-3" style={{ borderColor: "#fecaca" }}>
      <h2 className="font-semibold text-red-700">Eliminar cliente</h2>
      <p className="muted text-sm">Borra al cliente, sus instrumentos, trabajos, fotos/videos de avances y su acceso. Los pedidos de la tienda, las reseñas y los cobros quedan guardados.</p>
      {!abierto ? (
        <button type="button" onClick={() => setAbierto(true)} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
          Eliminar cliente
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm">
            {trabajos
              ? <>Vas a borrar a <b>{nombre}</b> junto con sus {trabajos} trabajo(s) y todas sus fotos y videos.</>
              : <>Vas a borrar a <b>{nombre}</b> y sus instrumentos.</>}{" "}
            No se puede deshacer.
          </p>
          <label className="field">
            <span>Para confirmar, escribí el código del cliente: <b className="font-mono">{codigo}</b></span>
            <input value={escrito} onChange={(e) => setEscrito(e.target.value)} autoFocus autoComplete="off" className="font-mono uppercase"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); borrar(); } }} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={borrar} disabled={!coincide || pendiente}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40">
              {pendiente ? "Borrando…" : "Sí, eliminar"}
            </button>
            <button type="button" className="btn-ghost text-sm" disabled={pendiente} onClick={() => { setAbierto(false); setEscrito(""); setError(null); }}>Cancelar</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
