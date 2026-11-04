import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";
import { FormTasacion } from "./FormTasacion";
import { clienteActual } from "@/lib/cliente-actual";

export const metadata: Metadata = {
  title: "Vendé o permutá tu instrumento — Música Música Web",
  description: "Pedí la tasación de tu instrumento usado con fotos. Lo compramos, lo tomamos en parte de pago o lo vendemos en consignación.",
};

export default async function VenderPage({ searchParams }: { searchParams: Promise<{ permuta?: string }> }) {
  const { permuta } = await searchParams;
  const codigo = permuta && /^U-\d{1,5}$/i.test(permuta) ? permuta.toUpperCase() : undefined;
  const cliente = await clienteActual();
  const volver = encodeURIComponent(`/usados/vender${codigo ? `?permuta=${codigo}` : ""}`);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--accent)" }}>Tasación online</p>
          <h1 className="titulo text-4xl">Vendé o permutá tu instrumento</h1>
          <p className="muted">Mandanos los datos y unas fotos. Lo evaluamos en el taller y te respondemos por WhatsApp con una propuesta.</p>
        </header>
        {cliente ? <FormTasacion permuta={codigo} cliente={cliente} /> : (
          <div className="card space-y-4">
            <h2 className="text-xl font-semibold">Ingresá con tu cuenta de cliente</h2>
            <p className="muted">Para tasar, vender, permutar o dejar en consignación un instrumento tenés que estar registrado. Así sabemos con quién hablamos y seguís todo desde tu cuenta.</p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/mi-cuenta/ingresar?volver=${volver}`} className="btn">Ya soy cliente: ingresar</Link>
              <Link href={`/registro?volver=${volver}`} className="btn-ghost">Registrarme</Link>
            </div>
            <p className="muted text-xs">Si ya sos cliente pero no tenés clave, pedila por WhatsApp.</p>
          </div>
        )}
      </main>
    </>
  );
}
