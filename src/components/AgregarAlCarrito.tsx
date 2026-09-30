"use client";

import Link from "next/link";
import { useState } from "react";
import { useCarrito } from "./Carrito";
import { pesos, type ItemCarrito } from "@/lib/tienda";

type Opcion = { varianteId: string | null; nombre: string; precio: number; stock: number | null };

/** Selector de variante + cantidad + botón. `stock` null = sin límite (servicios o venta sin stock). */
export function AgregarAlCarrito({ base, opciones, mostrarPrecio = true }: { base: Omit<ItemCarrito, "cantidad" | "clave" | "varianteId" | "precio" | "max">; opciones: Opcion[]; mostrarPrecio?: boolean }) {
  const { agregar } = useCarrito();
  const [sel, setSel] = useState(opciones.findIndex((o) => o.stock === null || o.stock > 0));
  const [cant, setCant] = useState(1);
  const [ok, setOk] = useState(false);
  const o = opciones[sel];
  const sinStock = sel < 0;

  return (
    <div className="space-y-3">
      {opciones.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {opciones.map((op, i) => {
            const agotado = op.stock !== null && op.stock <= 0;
            return (
              <button key={op.varianteId ?? i} type="button" disabled={agotado} onClick={() => { setSel(i); setCant(1); }}
                className="rounded-xl border px-3 py-2 text-sm disabled:opacity-40 disabled:line-through"
                style={{ borderColor: i === sel ? "var(--accent)" : "var(--line)", background: i === sel ? "color-mix(in srgb, var(--accent) 10%, var(--card))" : "var(--card)" }}>
                {op.nombre}
              </button>
            );
          })}
        </div>
      )}
      {o && mostrarPrecio && <p className="text-3xl font-semibold">{pesos(o.precio)}</p>}
      {o && o.stock !== null && o.stock <= 3 && o.stock > 0 && <p className="text-sm" style={{ color: "var(--accent)" }}>¡Quedan {o.stock}!</p>}
      {sinStock ? (
        <p className="card !p-3 text-sm">Sin stock por ahora. Escribinos y te avisamos cuando entre.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(o.stock === null || o.stock > 1) && (
            <div className="flex items-center rounded-xl border" style={{ borderColor: "var(--line)" }}>
              <button type="button" className="px-3 py-2" onClick={() => setCant(Math.max(1, cant - 1))} aria-label="Menos">−</button>
              <span className="w-8 text-center">{cant}</span>
              <button type="button" className="px-3 py-2" onClick={() => setCant(Math.min(o.stock ?? 99, cant + 1))} aria-label="Más">+</button>
            </div>
          )}
          <button type="button" className="btn flex-1"
            onClick={() => {
              agregar({ ...base, clave: `${base.tipo}:${base.id}:${o.varianteId ?? ""}`, varianteId: o.varianteId, precio: o.precio, nombre: o.varianteId ? `${base.nombre} — ${o.nombre}` : base.nombre, max: o.stock }, cant);
              setOk(true);
            }}>
            Agregar al carrito
          </button>
        </div>
      )}
      {ok && <p className="text-sm">Agregado. <Link href="/carrito" className="link">Ver carrito →</Link></p>}
    </div>
  );
}
