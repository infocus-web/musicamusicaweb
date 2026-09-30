"use client";

import Link from "next/link";
import { useCarrito } from "./Carrito";

export function BotonCarrito() {
  const { cantidad } = useCarrito();
  return (
    <Link href="/carrito" className="relative inline-flex items-center gap-1 hover:underline" aria-label={`Carrito (${cantidad})`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      Carrito
      {cantidad > 0 && <span className="badge ml-1" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>{cantidad}</span>}
    </Link>
  );
}
