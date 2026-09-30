import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { CarritoProvider } from "@/components/Carrito";
import { AsesorFlotante } from "@/components/AsesorFlotante";
import { obtenerAjustes } from "@/lib/ajustes";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Música Música Web — Taller de instrumentos",
  description: "Preparación y reparación de instrumentos musicales. Seguí el avance de tu instrumento online.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { whatsapp } = await obtenerAjustes();
  return (
    <html lang="es-AR">
      <body className={`${inter.variable} ${oswald.variable} antialiased`}>
        <CarritoProvider>
          {children}
          <SiteFooter />
          <AsesorFlotante whatsapp={whatsapp} />
        </CarritoProvider>
      </body>
    </html>
  );
}
