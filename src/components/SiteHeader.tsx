"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useCarrito } from "@/components/Carrito";

const NAV = [
  { href: "/tienda", label: "Tienda" },
  { href: "/tienda?cat=cuerdas", label: "Cuerdas y accesorios" },
  { href: "/tienda?cat=servicios", label: "Servicios del taller" },
  { href: "/usados", label: "Usados" },
  { href: "/usados/vender", label: "Vendé tu usado" },
  { href: "/nuestros-clientes", label: "Nuestros clientes" },
  { href: "/usados?seccion=liquidacion", label: "Liquidación", rojo: true },
];

function abrirAsesor(router: ReturnType<typeof useRouter>) {
  const w = window as unknown as { __asesorFlotante?: boolean };
  if (w.__asesorFlotante) window.dispatchEvent(new Event("abrir-asesor"));
  else router.push("/asesor");
}

/** Encabezado de las páginas públicas (estilo tienda de luthería). */
export function SiteHeader() {
  const router = useRouter();
  const ruta = usePathname();
  const { cantidad } = useCarrito();
  const [menu, setMenu] = useState(false);

  const buscador = (className = "") => (
    <form action="/buscar" className={`flex items-stretch overflow-hidden rounded-full border ${className}`} style={{ borderColor: "var(--line)", background: "var(--soft)" }}>
      <input name="q" placeholder="Buscá cuerdas, accesorios, usados…" className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none" aria-label="Buscar" />
      <button className="px-4" aria-label="Buscar">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_var(--line)]">
      <div className="hidden bg-[var(--soft)] py-1.5 text-center text-xs sm:block">
        <span className="font-semibold">Envíos a todo el país</span>
        <span className="mx-3 text-[var(--line)]">|</span>
        <span style={{ color: "var(--accent)" }} className="font-semibold">Revisado en nuestro taller</span>
        <span className="mx-3 text-[var(--line)]">|</span>
        <span>Pagá con Mercado Pago, transferencia o efectivo</span>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
        <button type="button" className="-ml-1 p-1 lg:hidden" onClick={() => setMenu(!menu)} aria-label="Menú" aria-expanded={menu}>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            {menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        <Link href="/" className="shrink-0" aria-label="Inicio"><Logo alto={44} prioridad /></Link>
        {buscador("hidden flex-1 md:flex")}
        <div className="ml-auto flex items-center gap-4 md:ml-0">
          <button type="button" onClick={() => abrirAsesor(router)} className="hidden rounded-full border-2 px-4 py-1.5 text-sm font-bold sm:block" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
            Asesor
          </button>
          <Link href="/mi-cuenta" aria-label="Mi cuenta" title="Mi cuenta" className="hover:opacity-70">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
          </Link>
          <Link href="/carrito" aria-label={`Carrito (${cantidad})`} title="Carrito" className="relative hover:opacity-70">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cantidad > 0 && <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold text-white" style={{ background: "var(--accent)" }}>{cantidad}</span>}
          </Link>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">{buscador()}</div>

      <nav className={`${menu ? "block" : "hidden"} border-t-2 lg:block`} style={{ borderColor: "var(--accent)" }}>
        <ul className="mx-auto flex max-w-7xl flex-col px-4 text-sm lg:flex-row lg:items-center lg:justify-between lg:gap-2">
          {NAV.map((n) => {
            const activo = ruta === n.href.split("?")[0] && n.href.indexOf("?") < 0;
            return (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setMenu(false)}
                  className={`block py-2.5 hover:underline lg:py-2 ${n.rojo ? "font-bold" : ""} ${activo ? "font-semibold" : ""}`}
                  style={n.rojo ? { color: "var(--accent)" } : undefined}>
                  {n.label}
                </Link>
              </li>
            );
          })}
          <li className="sm:hidden"><button type="button" onClick={() => { setMenu(false); abrirAsesor(router); }} className="py-2.5 font-bold" style={{ color: "var(--accent)" }}>Asesor</button></li>
        </ul>
      </nav>
    </header>
  );
}
