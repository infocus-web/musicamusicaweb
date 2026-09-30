import Link from "next/link";
import { obtenerAjustes, waTaller } from "@/lib/ajustes";

export async function SiteFooter() {
  const a = await obtenerAjustes();
  const wa = waTaller(a.whatsapp, "Hola! Te escribo desde la web.");
  const Col = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <div className="space-y-3">
      <h2 className="border-b pb-2 font-semibold" style={{ borderColor: "currentColor" }}>{titulo}</h2>
      <ul className="space-y-2 text-sm opacity-90">{children}</ul>
    </div>
  );
  return (
    <footer className="mt-16 bg-zinc-950 text-zinc-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <Col titulo="Links">
          <li><Link href="/contacto" className="hover:underline">Contacto</Link></li>
          <li><Link href="/quienes-somos" className="hover:underline">Quiénes somos</Link></li>
          <li><Link href="/nuestros-clientes" className="hover:underline">Nuestros clientes</Link></li>
          <li><Link href="/terminos" className="hover:underline">Términos y condiciones</Link></li>
        </Col>
        <Col titulo="Taller y usados">
          <li><Link href="/asesor" className="hover:underline">Asesor</Link></li>
          <li><Link href="/usados" className="hover:underline">Usados</Link></li>
          <li><Link href="/usados/vender" className="hover:underline">Vendé o permutá tu instrumento</Link></li>
          <li><Link href="/mejor-precio" className="hover:underline">Mejoramos tu presupuesto</Link></li>
        </Col>
        <Col titulo="Mi cuenta">
          <li><Link href="/mi-cuenta" className="hover:underline">Mi cuenta</Link></li>
          <li><Link href="/registro" className="hover:underline">Registrarme</Link></li>
          <li><Link href="/arrepentimiento" className="hover:underline">Botón de arrepentimiento</Link></li>
        </Col>
        {(wa || a.email || a.direccion || a.horarios || a.instagram) && <Col titulo="Contacto">
          {wa && <li><a href={wa} target="_blank" rel="noreferrer" className="hover:underline">WhatsApp {a.whatsapp}</a></li>}
          {a.email && <li><a href={`mailto:${a.email}`} className="hover:underline">{a.email}</a></li>}
          {a.direccion && <li><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.direccion)}`} target="_blank" rel="noreferrer" className="hover:underline">{a.direccion}</a></li>}
          {a.horarios && <li>{a.horarios}</li>}
          {a.instagram && <li><a href={`https://instagram.com/${a.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="hover:underline">@{a.instagram.replace(/^@/, "")}</a></li>}
        </Col>}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-zinc-800 px-4 py-4 text-xs text-zinc-400">
        <span>© {new Date().getFullYear()} Música Música Web · musicamusicaweb.com.ar</span>
        {/* Acceso del personal: si no hay sesión, /taller manda al login; si ya entraste, va directo al panel. */}
        <Link href="/taller" className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2.5 py-1 hover:border-zinc-500 hover:text-white">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          Acceso taller
        </Link>
      </div>
    </footer>
  );
}
