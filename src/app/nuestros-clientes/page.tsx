import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { TarjetaCaso } from "@/components/TarjetaCaso";
import { datosNuestrosClientes } from "@/lib/nuestros-clientes";
import { estrellas } from "@/lib/casos";

export const revalidate = 120;
export const metadata: Metadata = {
  title: "Nuestros clientes — Música Música Web",
  description: "Trabajos reales del taller: antes y después, videos y la opinión de cada cliente.",
};

export default async function NuestrosClientesPage() {
  const { casos, resenas, promedio } = await datosNuestrosClientes();
  const usadas = new Set(casos.map((c) => c.resena_id).filter(Boolean));
  const sueltas = resenas.filter((r) => !usadas.has(r.id) && r.comentario);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--accent)" }}>Nuestros clientes</p>
          <h1 className="titulo text-4xl sm:text-5xl">Trabajos reales, opiniones reales</h1>
          <p className="muted max-w-2xl">Instrumentos que pasaron por el taller, con fotos del antes y el después y lo que dijo cada cliente al retirarlo.</p>
          {promedio && (
            <p className="text-lg"><span style={{ color: "#f5b301" }}>{estrellas(Math.round(promedio))}</span> <b>{promedio.toFixed(1)}</b> <span className="muted">· {resenas.length} opiniones de clientes</span></p>
          )}
        </header>

        {casos.length === 0 ? (
          <p className="card muted">Muy pronto vas a ver acá los trabajos del taller. <Link href="/asesor" className="link">¿Necesitás un service?</Link></p>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {casos.map((c) => <TarjetaCaso key={c.id} c={c} r={resenas.find((r) => r.id === c.resena_id)} />)}
          </section>
        )}

        {sueltas.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Lo que dicen</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sueltas.slice(0, 12).map((r) => (
                <blockquote key={r.id} className="card space-y-1 text-sm">
                  <p style={{ color: "#f5b301" }}>{estrellas(r.puntaje)}</p>
                  <p>“{r.comentario}”</p>
                  <footer className="muted text-xs">— {r.nombre_publico}</footer>
                </blockquote>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
