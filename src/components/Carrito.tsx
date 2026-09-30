"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ItemCarrito } from "@/lib/tienda";

type Ctx = {
  items: ItemCarrito[];
  cantidad: number;
  subtotal: number;
  agregar: (i: Omit<ItemCarrito, "cantidad">, cantidad?: number) => void;
  cambiar: (clave: string, cantidad: number) => void;
  quitar: (clave: string) => void;
  vaciar: () => void;
  listo: boolean;
};

const CarritoCtx = createContext<Ctx | null>(null);
const KEY = "mmw-carrito-v1";

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setItems(JSON.parse(s)); } catch {}
    setListo(true);
    const sync = (e: StorageEvent) => { if (e.key === KEY) try { setItems(JSON.parse(e.newValue ?? "[]")); } catch {} };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => { if (listo) try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} }, [items, listo]);

  const tope = (i: ItemCarrito, n: number) => Math.max(1, Math.min(n, i.max ?? 99));

  const agregar = useCallback((i: Omit<ItemCarrito, "cantidad">, cantidad = 1) => {
    setItems((prev) => {
      const ex = prev.find((x) => x.clave === i.clave);
      if (ex) return prev.map((x) => (x.clave === i.clave ? { ...x, ...i, cantidad: tope({ ...x, ...i }, x.cantidad + cantidad) } : x));
      return [...prev, { ...i, cantidad: tope({ ...i, cantidad }, cantidad) }];
    });
  }, []);
  const cambiar = useCallback((clave: string, n: number) => setItems((p) => p.map((x) => (x.clave === clave ? { ...x, cantidad: tope(x, n) } : x))), []);
  const quitar = useCallback((clave: string) => setItems((p) => p.filter((x) => x.clave !== clave)), []);
  const vaciar = useCallback(() => setItems([]), []);

  const valor = useMemo(() => ({
    items, listo, agregar, cambiar, quitar, vaciar,
    cantidad: items.reduce((a, i) => a + i.cantidad, 0),
    subtotal: items.reduce((a, i) => a + i.cantidad * i.precio, 0),
  }), [items, listo, agregar, cambiar, quitar, vaciar]);

  return <CarritoCtx.Provider value={valor}>{children}</CarritoCtx.Provider>;
}

export function useCarrito() {
  const c = useContext(CarritoCtx);
  if (!c) throw new Error("useCarrito fuera de CarritoProvider");
  return c;
}
