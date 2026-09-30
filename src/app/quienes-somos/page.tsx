import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { TextoLargo } from "@/components/TextoLargo";
import { obtenerAjustes } from "@/lib/ajustes";

export const revalidate = 300;
export const metadata: Metadata = { title: "Quiénes somos — Música Música Web" };

export default async function QuienesSomosPage() {
  const { quienes_somos } = await obtenerAjustes();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="text-3xl font-semibold">Quiénes somos</h1>
        {quienes_somos ? <TextoLargo texto={quienes_somos} /> : (
          <p className="muted">Somos un taller dedicado a la preparación, calibración y reparación de instrumentos musicales. Muy pronto vas a encontrar acá nuestra historia.</p>
        )}
        <p><Link href="/nuestros-clientes" className="link">Mirá trabajos que hicimos para nuestros clientes →</Link></p>
      </main>
    </>
  );
}
