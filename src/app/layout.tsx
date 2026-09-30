import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Música Música Web — Taller de instrumentos",
  description: "Preparación y reparación de instrumentos musicales. Seguí el avance de tu instrumento online.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
