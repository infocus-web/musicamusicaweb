import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { FormPresupuesto } from "./FormPresupuesto";

export const metadata: Metadata = {
  title: "¿Ya te pasaron un presupuesto? — Música Música Web",
  description: "Mandanos el presupuesto de un instrumento o de una reparación y te hacemos nuestra mejor propuesta.",
};

export default function MejorPrecioPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--accent)" }}>Mejoramos tu presupuesto</p>
          <h1 className="text-3xl font-semibold">¿Ya te pasaron un presupuesto?</h1>
          <p className="muted">De un instrumento o de una reparación: mandanos la foto, lo analizamos y te respondemos por WhatsApp con nuestra mejor propuesta.</p>
        </header>
        <FormPresupuesto />
      </main>
    </>
  );
}
