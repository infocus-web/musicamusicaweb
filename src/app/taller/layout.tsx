import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { salir } from "../login/actions";

export default async function TallerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staff } = await supabase.from("staff").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!staff) {
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <div className="card max-w-md space-y-3">
          <h1 className="text-xl font-semibold">Sin acceso al taller</h1>
          <p className="muted text-sm">
            La cuenta {user.email} todavía no está habilitada como personal del taller.
          </p>
          <form action={salir}><button className="btn-ghost">Salir</button></form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b" style={{ borderColor: "var(--line)" }}>
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm">
          <Link href="/taller" className="font-semibold text-base">Musica Musica · Taller</Link>
          <Link href="/taller" className="muted hover:underline">Trabajos</Link>
          <Link href="/taller/clientes" className="muted hover:underline">Clientes</Link>
          <form action={salir} className="ml-auto"><button className="muted hover:underline">Salir</button></form>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
