import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/Logo";
import { TrabajosCliente } from "@/components/TrabajosCliente";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Seguimiento de tu instrumento — Música Música Web",
  robots: { index: false, follow: false },
};

export default async function SeguimientoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) notFound();

  const { data: cliente } = await createAdminClient()
    .from("clientes").select("id, nombre, codigo").eq("token", token).maybeSingle();
  if (!cliente) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <Logo alto={56} prioridad />
        <h1 className="text-2xl font-semibold">Hola, {cliente.nombre.split(" ")[0]}</h1>
        <p className="muted text-sm">Código de cliente <span className="font-mono">{cliente.codigo}</span></p>
      </header>

      <TrabajosCliente clienteId={cliente.id} />

      <footer className="muted text-center text-xs">Este link es personal. No lo compartas.</footer>
    </main>
  );
}
