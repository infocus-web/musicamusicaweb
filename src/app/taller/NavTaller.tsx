"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/taller", label: "Trabajos", activo: (p: string) => p === "/taller" || p.startsWith("/taller/trabajos") },
  { href: "/taller/clientes", label: "Clientes" },
  { href: "/taller/tienda", label: "Tienda" },
  { href: "/taller/pedidos", label: "Pedidos" },
  { href: "/taller/usados", label: "Usados" },
  { href: "/taller/consultas", label: "Consultas" },
  { href: "/taller/nuestros-clientes", label: "Nuestros clientes" },
  { href: "/taller/imagenes", label: "Imágenes y videos" },
  { href: "/taller/equipo", label: "Equipo", admin: true },
  { href: "/taller/ajustes", label: "Ajustes", admin: true },
];

/** Menú del panel: la sección donde estás queda en rojo y subrayada. */
export function NavTaller({ esAdmin }: { esAdmin: boolean }) {
  const p = usePathname();
  return (
    <>
      {LINKS.filter((l) => !l.admin || esAdmin).map((l) => {
        const activo = l.activo ? l.activo(p) : p === l.href || p.startsWith(l.href + "/");
        return (
          <Link key={l.href} href={l.href} aria-current={activo ? "page" : undefined}
            className={activo ? "font-semibold underline decoration-2 underline-offset-[6px]" : "muted hover:underline"}
            style={activo ? { color: "var(--accent)" } : undefined}>
            {l.label}
          </Link>
        );
      })}
    </>
  );
}
