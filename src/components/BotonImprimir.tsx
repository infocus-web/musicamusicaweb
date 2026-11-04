"use client";
export function BotonImprimir({ children = "Imprimir / Guardar PDF", className = "btn" }: { children?: React.ReactNode; className?: string }) {
  return <button type="button" className={className} onClick={() => window.print()}>{children}</button>;
}
