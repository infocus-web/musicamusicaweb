import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { FormTasacion } from "./FormTasacion";

export const metadata: Metadata = {
  title: "Vendé o permutá tu instrumento — Música Música Web",
  description: "Pedí la tasación de tu instrumento usado con fotos. Lo compramos, lo tomamos en parte de pago o lo vendemos en consignación.",
};

export default async function VenderPage({ searchParams }: { searchParams: Promise<{ permuta?: string }> }) {
  const { permuta } = await searchParams;
  const codigo = permuta && /^U-\d{1,5}$/i.test(permuta) ? permuta.toUpperCase() : undefined;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--accent)" }}>Tasación online</p>
          <h1 className="text-3xl font-semibold">Vendé o permutá tu instrumento</h1>
          <p className="muted">Mandanos los datos y unas fotos. Lo evaluamos en el taller y te respondemos por WhatsApp con una propuesta.</p>
        </header>
        <FormTasacion permuta={codigo} />
      </main>
    </>
  );
}
