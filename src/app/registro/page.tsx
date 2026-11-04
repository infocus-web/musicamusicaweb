import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { FormRegistro } from "./FormRegistro";
import { rutaSegura } from "@/lib/cliente-actual";

export const metadata: Metadata = {
  title: "Registrate — Música Música Web",
  description: "Registrate como cliente del taller y seguí el avance de tus instrumentos online.",
};

export default async function RegistroPage({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const volver = rutaSegura((await searchParams).volver) ?? undefined;
  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <header className="space-y-3">
        <Logo alto={64} prioridad />
        <h1 className="text-2xl font-semibold">Registrate como cliente</h1>
        <p className="muted">Te damos un código de cliente y un link privado para ver el avance de tus instrumentos, con fotos y videos.</p>
      </header>
      <FormRegistro volver={volver} />
    </main>
  );
}
