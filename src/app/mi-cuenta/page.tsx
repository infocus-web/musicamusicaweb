import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolverCliente } from "@/lib/acceso-cliente";
import { PanelCliente } from "@/components/panel-cliente/PanelCliente";
import { salirCliente } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi panel — Música Música Web", robots: { index: false } };

export default async function MiCuentaPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/mi-cuenta/ingresar");

  const cliente = await resolverCliente(null);
  if (!cliente) {
    // Personal del taller: su lugar es el panel del taller.
    const { data: staff } = await supabase.from("staff").select("user_id").eq("user_id", user.id).maybeSingle();
    if (staff) redirect("/taller");
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <div className="card max-w-sm space-y-3">
          <h1 className="text-xl font-semibold">Esta cuenta no es de cliente</h1>
          <p className="muted text-sm">Salí y volvé a entrar con tu teléfono o email y tu clave.</p>
          <form action={salirCliente}><button className="btn">Salir</button></form>
        </div>
      </main>
    );
  }

  return (
    <PanelCliente cliente={cliente} token={null} tab={tab} base="/mi-cuenta"
      salir={<form action={salirCliente}><button className="muted hover:underline">Salir</button></form>} />
  );
}
