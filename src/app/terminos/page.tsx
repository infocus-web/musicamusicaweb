import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { TextoLargo } from "@/components/TextoLargo";
import { obtenerAjustes } from "@/lib/ajustes";

export const revalidate = 300;
export const metadata: Metadata = { title: "Términos y condiciones — Música Música Web" };

const BASE = `# Servicios del taller
Todo trabajo se realiza con presupuesto previo aprobado por el cliente. Si durante el trabajo aparece algo no previsto, avisamos antes de continuar.

Los instrumentos listos deben retirarse dentro de los 30 días del aviso. Pasado ese plazo el taller puede cobrar guarda.

# Garantía
Los trabajos tienen la garantía indicada en cada orden. No cubre golpes, mal uso, humedad ni intervenciones de terceros.

Los usados revisados tienen la garantía indicada en cada publicación.

# Compras y derecho de arrepentimiento
En compras a distancia tenés 10 días corridos desde que recibís el producto para arrepentirte (art. 34, Ley 24.240), usando el Botón de arrepentimiento de esta web. El producto debe devolverse sin uso y en su estado original.

# Datos personales
Usamos tus datos solo para gestionar tus trabajos y compras y para contactarte por ellos. Podés pedir que los modifiquemos o eliminemos escribiéndonos (Ley 25.326).`;

export default async function TerminosPage() {
  const { terminos } = await obtenerAjustes();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="text-3xl font-semibold">Términos y condiciones</h1>
        <TextoLargo texto={terminos || BASE} />
      </main>
    </>
  );
}
