"use client";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/** Botón "Guardar" que muestra "Guardando…" y después "✓ Guardado" (va dentro de un <form>). */
export function BotonGuardar({ children = "Guardar", className = "btn", aviso }: { children?: React.ReactNode; className?: string; aviso?: string }) {
  const { pending } = useFormStatus();
  const antes = useRef(false);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (antes.current && !pending) {
      setOk(true);
      const t = setTimeout(() => setOk(false), 4000);
      antes.current = pending;
      return () => clearTimeout(t);
    }
    antes.current = pending;
  }, [pending]);
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-2">
      {ok && (
        <span role="status" className="text-sm font-medium" style={{ color: "#15803d" }}>
          ✓ Guardado{aviso ? <span className="block text-xs font-normal muted">{aviso}</span> : null}
        </span>
      )}
      <button className={className} disabled={pending} aria-busy={pending}>{pending ? "Guardando…" : children}</button>
    </span>
  );
}
