import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { FormArrepentimiento } from "./Form";

export const metadata: Metadata = { title: "Botón de arrepentimiento — Música Música Web" };

export default function ArrepentimientoPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <header className="space-y-2">
          <h1 className="titulo text-4xl">Botón de arrepentimiento</h1>
          <p className="muted">Si compraste a distancia, tenés 10 días corridos desde que recibiste el producto para revocar la compra, sin costo ni explicación (Ley 24.240, art. 34 y Res. 424/2020). Completá el formulario y te damos un código de trámite.</p>
        </header>
        <FormArrepentimiento />
      </main>
    </>
  );
}
