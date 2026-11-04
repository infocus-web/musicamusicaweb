import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { obtenerStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { salir } from "../login/actions";
import { Logo } from "@/components/Logo";
import { BotonTema } from "./BotonTema";
import { NavTaller, type Contadores } from "./NavTaller";

/** Cuenta lo que está esperando que alguien del taller haga algo (se muestra en el menú). */
async function contar(): Promise<Contadores> {
  const supabase = await createClient();
  const n = (r: { count: number | null }) => r.count ?? 0;
  const [pedidos, tasaciones, arrep, clientes, listos, chat] = await Promise.all([
    supabase.from("pedidos").select("id", { count: "exact", head: true }).in("estado", ["pendiente", "a_cotizar", "pagado"]),
    supabase.from("tasaciones").select("id", { count: "exact", head: true }).eq("estado", "nueva"),
    supabase.from("arrepentimientos").select("id", { count: "exact", head: true }).eq("estado", "recibido"),
    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("revisado", false),
    supabase.from("trabajos").select("id", { count: "exact", head: true }).eq("estado", "listo"),
    supabase.from("mensajes").select("id", { count: "exact", head: true }).eq("autor", "cliente").eq("leido_taller", false),
  ]);
  return { pedidos: n(pedidos), consultas: n(tasaciones) + n(arrep), clientesNuevos: n(clientes), listos: n(listos), chat: n(chat) };
}

export default async function TallerLayout({ children }: { children: React.ReactNode }) {
  const { user, staff } = await obtenerStaff();
  if (!user) redirect("/login");

  if (!staff) {
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <div className="card max-w-md space-y-3">
          <h1 className="text-xl font-semibold">Sin acceso al taller</h1>
          <p className="muted text-sm">
            Esta cuenta no está habilitada como personal del taller. Si sos cliente, entrá desde <Link className="link" href="/mi-cuenta">Mi cuenta</Link>.
          </p>
          <form action={salir}><button className="btn-ghost">Salir</button></form>
        </div>
      </main>
    );
  }

  const oscuro = (await cookies()).get("tema-taller")?.value === "oscuro";
  const contadores = await contar();

  const pie = (
    <div className="space-y-3 px-1 text-sm">
      <Link href="/taller" className="flex items-center gap-2 font-semibold"><Logo alto={30} /> <span>Taller</span></Link>
      <p className="muted text-xs">{staff.nombre ?? user.email}<br />{staff.rol === "admin" ? "Administrador" : "Técnico"}</p>
      <div className="flex items-center gap-3">
        <BotonTema inicial={oscuro} />
        <Link href="/taller/mi-clave" className="muted hover:underline">Mi clave</Link>
        <form action={salir}><button className="muted hover:underline">Salir</button></form>
      </div>
      <Link href="/" target="_blank" className="link text-xs">Ver la web pública ↗</Link>
    </div>
  );

  return (
    <div id="panel-taller" className={`min-h-screen ${oscuro ? "tema-oscuro" : ""}`}>
      <NavTaller esAdmin={staff.rol === "admin"} contadores={contadores} pie={pie} />
      <main className="px-4 py-6 lg:ml-64 lg:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
