import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { obtenerAjustes, waTaller } from "@/lib/ajustes";

export const revalidate = 300;
export const metadata: Metadata = { title: "Contacto — Música Música Web" };

export default async function ContactoPage() {
  const a = await obtenerAjustes();
  const wa = waTaller(a.whatsapp, "Hola! Te escribo desde la web.");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="titulo text-4xl">Contacto</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="card space-y-1 hover:shadow-sm"><p className="muted text-sm">WhatsApp</p><p className="font-semibold">{a.whatsapp}</p></a>}
          {a.email && <a href={`mailto:${a.email}`} className="card space-y-1 hover:shadow-sm"><p className="muted text-sm">Email</p><p className="font-semibold">{a.email}</p></a>}
          {a.direccion && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.direccion)}`} target="_blank" rel="noreferrer" className="card space-y-1 hover:shadow-sm"><p className="muted text-sm">Dirección</p><p className="font-semibold">{a.direccion}</p></a>}
          {a.horarios && <div className="card space-y-1"><p className="muted text-sm">Horarios</p><p className="font-semibold">{a.horarios}</p></div>}
        </div>
        {!wa && !a.email && !a.direccion && <p className="card muted">Pronto publicamos los datos de contacto.</p>}
        {a.direccion && (
          <iframe title="Mapa" className="h-72 w-full rounded-2xl border" style={{ borderColor: "var(--line)" }} loading="lazy"
            src={`https://www.google.com/maps?q=${encodeURIComponent(a.direccion)}&output=embed`} />
        )}
        <p className="muted text-sm">¿Querés que te recomendemos algo? Probá el <Link href="/asesor" className="link">asesor</Link>.</p>
      </main>
    </>
  );
}
