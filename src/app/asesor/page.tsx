import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { obtenerAjustes } from "@/lib/ajustes";
import { Asesor } from "./Asesor";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Asesor — Música Música Web",
  description: "Te ayudamos a elegir instrumento o a saber qué service necesita el tuyo, en 30 segundos.",
};

export default async function AsesorPage() {
  const { whatsapp } = await obtenerAjustes();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--accent)" }}>Asesor del taller</p>
        <Asesor whatsapp={whatsapp} />
      </main>
    </>
  );
}
