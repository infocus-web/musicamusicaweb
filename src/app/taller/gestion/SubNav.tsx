"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/taller/gestion", "Resumen"], ["/taller/gestion/ventas", "Ventas"], ["/taller/gestion/stock", "Stock"],
  ["/taller/gestion/compras", "Compras"], ["/taller/gestion/proveedores", "Proveedores"], ["/taller/gestion/comprobantes", "Comprobantes"],
];

export function SubNav() {
  const p = usePathname();
  return (
    <nav aria-label="Gestión" className="sin-barra -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 print:hidden">
      {TABS.map(([href, label]) => {
        const activo = href === "/taller/gestion" ? p === href : p.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={activo ? "page" : undefined}
            className="shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium"
            style={activo ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : { borderColor: "var(--line)" }}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
