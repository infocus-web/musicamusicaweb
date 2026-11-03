import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { TextoLargo } from "@/components/TextoLargo";
import { obtenerAjustes } from "@/lib/ajustes";

export const revalidate = 300;
export const metadata: Metadata = { title: "Términos y condiciones — Música Música Web" };

const BASE = `# Servicios del taller
Atendemos con turno previo. Cada trabajo se registra en una orden de trabajo, donde dejamos asentado, con fotos, el estado del instrumento al ingresar y los accesorios que deja el cliente (estuche, cable, correa, etc.). Al dejar el instrumento, el cliente acepta esa orden.

El diagnóstico es sin cargo. Antes de empezar te pasamos el presupuesto, y no realizamos ningún trabajo sin tu aprobación. Si no lo aprobás, retirás el instrumento sin cargo. Si durante el trabajo surge algo no previsto, te avisamos antes de continuar.

Si el trabajo requiere comprar repuestos, pedimos una seña para encargarlos. Usamos repuestos originales o de calidad equivalente, y siempre te informamos cuál.

# Retiro del instrumento
Te avisamos cuando el instrumento está listo. Tenés 30 días para retirarlo sin costo; después, se cobra guarda. Si pasan 90 días desde el aviso sin que lo retires ni te comuniques con nosotros, se considera abandonado y el taller puede disponer de él para cubrir lo adeudado, con aviso previo al contacto que nos dejaste.

# Envíos y retiro a domicilio
Cuando el instrumento se envía por correo o transporte, el riesgo del traslado corre por cuenta del cliente. El taller responde por el instrumento desde que lo recibe hasta que lo despacha. Te recomendamos embalarlo bien y contratar el seguro del correo.

# Garantía
Los trabajos del taller tienen una garantía de 30 días corridos desde su finalización. Si en ese plazo aparece una falla en el trabajo realizado, la corregimos sin cargo. La garantía no cubre golpes, caídas, mal uso, humedad o cambios de clima, el desgaste normal (cuerdas, trastes, pilas) ni intervenciones de terceros.

Los instrumentos usados que vendemos tienen 3 meses de garantía desde la entrega, y los productos nuevos, 6 meses.

# Compras online y derecho de arrepentimiento
En las compras a distancia tenés 10 días corridos, desde que recibís el producto, para arrepentirte (art. 34, Ley 24.240). Podés hacerlo con el Botón de arrepentimiento de esta web. El producto debe devolverse sin uso, completo y en su estado original. Este derecho no aplica a los servicios del taller ya realizados.

# Datos personales
Usamos tus datos solo para gestionar tus trabajos y compras, y para contactarte por ellos. Las fotos y los videos de tu instrumento solo se ven con tu link privado; si queremos mostrarlos en la web o en redes, te pedimos permiso antes. Podés pedir que modifiquemos o eliminemos tus datos escribiéndonos (Ley 25.326).`;

export default async function TerminosPage() {
  const { terminos } = await obtenerAjustes();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="titulo text-4xl">Términos y condiciones</h1>
        <TextoLargo texto={terminos || BASE} />
      </main>
    </>
  );
}
