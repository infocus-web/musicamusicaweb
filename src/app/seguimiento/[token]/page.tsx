import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolverCliente } from "@/lib/acceso-cliente";
import { PanelCliente } from "@/components/panel-cliente/PanelCliente";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Mi panel — Música Música Web",
  robots: { index: false, follow: false },
};

/** El link privado que le mandamos al cliente por WhatsApp abre su panel completo, sin clave. */
export default async function SeguimientoPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { token } = await params;
  const { tab } = await searchParams;
  const cliente = await resolverCliente(token);
  if (!cliente) notFound();
  return <PanelCliente cliente={cliente} token={token} tab={tab} base={`/seguimiento/${token}`} />;
}
