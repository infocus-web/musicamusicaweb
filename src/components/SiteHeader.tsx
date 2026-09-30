import Link from "next/link";
import { Logo } from "@/components/Logo";

/** Encabezado de las páginas públicas. */
export function SiteHeader() {
  return (
    <header className="border-b" style={{ borderColor: "var(--line)" }}>
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm">
        <Link href="/" className="mr-auto"><Logo alto={36} /></Link>
        <Link href="/usados" className="hover:underline">Usados</Link>
        <Link href="/nuestros-clientes" className="hover:underline">Nuestros clientes</Link>
        <Link href="/asesor" className="font-semibold" style={{ color: "var(--accent)" }}>Asesor</Link>
        <Link href="/registro" className="hover:underline">Registrate</Link>
        <Link href="/mi-cuenta" className="hover:underline">Mi cuenta</Link>
      </nav>
    </header>
  );
}
