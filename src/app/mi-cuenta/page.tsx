import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/Logo";
import { TrabajosCliente } from "@/components/TrabajosCliente";
import { FormCambiarClave } from "@/components/FormCambiarClave";
import { salirCliente } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi cuenta — Música Música Web", robots: { index: false } };

export default async function MiCuentaPage({ searchParams }: { searchParams: Promise<{ clave?: string }> }) {
  const { clave } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/mi-cuenta/ingresar");

  // El cliente se busca por su usuario (validado arriba por Supabase Auth).
  const { data: cliente } = await createAdminClient()
    .from("clientes").select("id, nombre, codigo").eq("user_id", user.id).maybeSingle();

  if (!cliente) {
    // Personal del taller: su lugar es el panel.
    const { data: staff } = await supabase.from("staff").select("user_id").eq("user_id", user.id).maybeSingle();
    if (staff) redirect("/taller");
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <div className="card max-w-sm space-y-3">
          <h1 className="text-xl font-semibold">Esta cuenta no es de cliente</h1>
          <p className="muted text-sm">Salí y volvé a entrar con tu código de cliente y tu clave.</p>
          <form action={salirCliente}><button className="btn">Entrar con mi código</button></form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Logo alto={56} prioridad />
          <h1 className="text-2xl font-semibold">Hola, {cliente.nombre.split(" ")[0]}</h1>
          <p className="muted text-sm">Código de cliente <span className="font-mono">{cliente.codigo}</span></p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/mi-cuenta?clave=1" className="link">Cambiar clave</Link>
          <form action={salirCliente}><button className="muted hover:underline">Salir</button></form>
        </div>
      </header>

      {clave && (
        <section className="space-y-2">
          <h2 className="font-semibold">Cambiar mi clave</h2>
          <FormCambiarClave minimo={6} />
        </section>
      )}

      <TrabajosCliente clienteId={cliente.id} />
    </main>
  );
}
