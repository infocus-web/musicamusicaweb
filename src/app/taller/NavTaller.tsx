"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type Contadores = { pedidos: number; consultas: number; clientesNuevos: number; listos: number; chat: number; avisos: number; turnos: number };

type Item = { href: string; label: string; icono: keyof typeof ICONOS; admin?: boolean; contador?: keyof Contadores; activo?: (p: string) => boolean };

const GRUPOS: { titulo: string; items: Item[] }[] = [
  { titulo: "Taller", items: [
    { href: "/taller", label: "Trabajos", icono: "llave", contador: "listos", activo: (p) => p === "/taller" || p.startsWith("/taller/trabajos") },
    { href: "/taller/turnos", label: "Turnos", icono: "calendario", contador: "turnos" },
    { href: "/taller/clientes", label: "Clientes", icono: "personas", contador: "clientesNuevos" },
  ] },
  { titulo: "Ventas", items: [
    { href: "/taller/gestion", label: "Gestión", icono: "grafico", admin: true },
    { href: "/taller/pedidos", label: "Pedidos", icono: "caja", contador: "pedidos" },
    { href: "/taller/tienda", label: "Productos", icono: "etiqueta" },
    { href: "/taller/usados", label: "Usados", icono: "guitarra" },
  ] },
  { titulo: "Mensajes", items: [
    { href: "/taller/avisos", label: "Avisos por WhatsApp", icono: "whatsapp", contador: "avisos" },
    { href: "/taller/mensajes", label: "Chat con clientes", icono: "chat", contador: "chat" },
    { href: "/taller/consultas", label: "Consultas de la web", icono: "sobre", contador: "consultas" },
  ] },
  { titulo: "La web", items: [
    { href: "/taller/imagenes", label: "Portada e imágenes", icono: "foto" },
    { href: "/taller/nuestros-clientes", label: "Nuestros clientes", icono: "estrella" },
    { href: "/taller/novedades", label: "Novedades", icono: "megafono" },
    { href: "/taller/ajustes", label: "Ajustes y textos", icono: "engranaje", admin: true },
    { href: "/taller/equipo", label: "Equipo", icono: "escudo", admin: true },
  ] },
];

const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ICONOS = {
  llave: <path {...p} d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />,
  personas: <g {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.5 3.3-5.5 6.5-5.5s6 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.3 2.5 3.5 5.2" /></g>,
  caja: <g {...p}><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5 12 12l9-4.5M12 12v9" /></g>,
  etiqueta: <g {...p}><path d="M3 12V3h9l9 9-9 9z" /><circle cx="7.5" cy="7.5" r="1.3" /></g>,
  guitarra: <g {...p}><path d="m14 10 6-6M18 2l4 4" /><path d="M11.5 9.5c-2-1-4.5-.5-5.5 1.5-.6 1.2-2 1.2-3 2.5-1.5 2 0 5 2 6.5s4.5 3.5 6.5 2 1.3-2.4 2.5-3c2-1 2.5-3.5 1.5-5.5" /><circle cx="9.5" cy="14.5" r="1.3" /></g>,
  sobre: <g {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></g>,
  foto: <g {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></g>,
  estrella: <path {...p} d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />,
  engranaje: <g {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></g>,
  calendario: <g {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></g>,
  whatsapp: <g {...p}><path d="M3.5 20.5l1.3-4.6A8.5 8.5 0 1 1 8 19.3z" /><path d="M9 9.5c.3 1.8 2.6 4.4 4.9 5 .7.2 1.6-.3 1.8-1l-1.5-1-1 .6c-.9-.4-1.9-1.4-2.3-2.3l.6-1-1-1.5c-.7.2-1.2 1.1-1 1.7z" /></g>,
  grafico: <g {...p}><path d="M3 3v18h18" /><path d="M7 15l4-5 3 3 5-7" /></g>,
  chat: <g {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z" /><path d="M8.5 11h7M8.5 14h4" /></g>,
  megafono: <g {...p}><path d="M3 10v4a1 1 0 0 0 1 1h3l7 4V5L7 9H4a1 1 0 0 0-1 1z" /><path d="M18 9a4 4 0 0 1 0 6" /></g>,
  escudo: <path {...p} d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />,
};

/** Menú lateral del panel, agrupado, con contadores de pendientes. En el celular se abre con el botón ☰. */
export function NavTaller({ esAdmin, contadores, pie }: { esAdmin: boolean; contadores: Contadores; pie: React.ReactNode }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  useEffect(() => setAbierto(false), [ruta]);

  const menu = (
    <nav aria-label="Menú del taller" className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <Link href="/taller/recibir" className="btn flex items-center justify-center gap-2 !py-2.5 text-sm font-bold">
        <span className="text-lg leading-none">+</span> Recibir instrumento
      </Link>
      {GRUPOS.map((g) => {
        const items = g.items.filter((i) => !i.admin || esAdmin);
        if (!items.length) return null;
        return (
          <div key={g.titulo}>
            <p className="muted mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest">{g.titulo}</p>
            <ul className="space-y-0.5">
              {items.map((i) => {
                const activo = i.activo ? i.activo(ruta) : ruta === i.href || ruta.startsWith(i.href + "/");
                const n = i.contador ? contadores[i.contador] : 0;
                return (
                  <li key={i.href}>
                    <Link href={i.href} aria-current={activo ? "page" : undefined}
                      className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-[var(--soft)]"
                      style={activo ? { background: "var(--soft)", color: "var(--fg)", fontWeight: 600 } : undefined}>
                      {activo && <span aria-hidden className="absolute inset-y-1.5 left-0 w-1 rounded-full" style={{ background: "var(--accent)" }} />}
                      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>{ICONOS[i.icono]}</svg>
                      <span className="flex-1">{i.label}</span>
                      {n > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold" style={{ background: "var(--accent)", color: "#fff" }} aria-label={`${n} pendientes`}>{n}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      <div className="mt-auto border-t pt-4" style={{ borderColor: "var(--line)" }}>{pie}</div>
    </nav>
  );

  return (
    <>
      {/* Barra superior solo en celular */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-2.5 lg:hidden" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
        <button type="button" onClick={() => setAbierto(true)} aria-label="Abrir menú" aria-expanded={abierto} className="-ml-1 p-1">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <span className="font-semibold">Taller</span>
        {contadores.pedidos + contadores.consultas + contadores.chat + contadores.avisos + contadores.turnos > 0 && <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} aria-label="Hay pendientes" />}
        <Link href="/taller/recibir" className="btn ml-auto !px-3 !py-1.5 text-sm">+ Recibir</Link>
      </div>

      {/* Lateral fijo en computadora */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r lg:block" style={{ borderColor: "var(--line)", background: "var(--card)" }}>{menu}</aside>

      {/* Cajón en celular */}
      {abierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAbierto(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-2xl" style={{ background: "var(--card)" }}>{menu}</aside>
        </div>
      )}
    </>
  );
}
