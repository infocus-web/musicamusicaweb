import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { clienteActual } from "@/lib/cliente-actual";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Armá tu instrumento — Música Música Web",
  description: "Elegí parte por parte cómo querés tu instrumento y pedile el presupuesto al taller desde tu cuenta.",
};

const DESTINO = "/mi-cuenta?tab=armar";

/** Entrada a "Armá tu instrumento" desde la web: si ya inició sesión va directo al panel; si no, se registra (o ingresa) y vuelve solo. */
export default async function ArmarPage() {
  if (await clienteActual()) redirect(DESTINO);
  const volver = encodeURIComponent(DESTINO);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--accent)" }}>Taller a medida</p>
          <h1 className="titulo text-4xl">Armá tu instrumento</h1>
          <p className="muted">Elegí parte por parte cómo lo querés: cuerpo, mástil, pastillas, hardware… Se guarda solo, lo vas armando de a poco y cuando esté listo nos pedís el presupuesto. Te respondemos en tu cuenta.</p>
        </header>

        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Primero, registrate</h2>
          <p className="muted">Te damos tu código de cliente y una clave. Así tu armado queda guardado y seguís todo desde tu cuenta: el presupuesto, el chat con el taller y el avance.</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/registro?volver=${volver}`} className="btn">Registrarme y empezar</Link>
            <Link href={`/mi-cuenta/ingresar?volver=${volver}`} className="btn-ghost">Ya soy cliente: ingresar</Link>
          </div>
          <p className="muted text-xs">Si ya sos cliente pero no tenés clave, pedila por WhatsApp.</p>
        </div>
      </main>
    </>
  );
}
