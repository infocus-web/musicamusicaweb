"use client";

import { useState } from "react";

type V = { id?: string; nombre: string; precio: number | null; stock: number };

/** Opciones del producto (calibre, largo, color…). Si no cargás ninguna se usa el precio y stock generales. */
export function Variantes({ iniciales }: { iniciales: V[] }) {
  const [filas, setFilas] = useState<V[]>(iniciales);
  return (
    <div className="space-y-2 sm:col-span-2">
      <div className="flex items-center justify-between">
        <span className="muted text-sm">Opciones / variantes (calibre, largo, color…)</span>
        <button type="button" className="link text-sm" onClick={() => setFilas([...filas, { nombre: "", precio: null, stock: 0 }])}>+ Agregar opción</button>
      </div>
      {filas.length === 0 && <p className="muted text-xs">Sin opciones: se usa el precio y el stock de arriba.</p>}
      {filas.map((v, i) => (
        <div key={v.id ?? `n${i}`} className="grid grid-cols-[1fr_110px_80px_auto] items-center gap-2">
          <input type="hidden" name="var_id" value={v.id ?? ""} />
          <input name="var_nombre" defaultValue={v.nombre} placeholder="Ej.: 10-46" className="rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: "var(--line)", background: "var(--bg)" }} />
          <input name="var_precio" defaultValue={v.precio ?? ""} placeholder="Precio (igual)" inputMode="decimal" className="rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: "var(--line)", background: "var(--bg)" }} />
          <input name="var_stock" defaultValue={v.stock} placeholder="Stock" inputMode="numeric" className="rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: "var(--line)", background: "var(--bg)" }} />
          <button type="button" className="text-sm text-red-600" onClick={() => setFilas(filas.filter((_, j) => j !== i))} aria-label="Quitar opción">✕</button>
        </div>
      ))}
    </div>
  );
}
