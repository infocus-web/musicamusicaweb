import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerStaff } from "@/lib/auth";
import { salir } from "../login/actions";
import { Logo } from "@/components/Logo";
import { cookies } from "next/headers";
import { BotonTema } from "./BotonTema";
import { NavTaller } from "./NavTaller";

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

  return (
    <div id="panel-taller" className={`min-h-screen ${oscuro ? "tema-oscuro" : ""}`}>
      <header className="border-b" style={{ borderColor: "var(--line)" }}>
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm">
          <Link href="/taller" className="flex items-center gap-2 font-semibold"><Logo alto={32} /> <span>Taller</span></Link>
          <NavTaller esAdmin={staff.rol === "admin"} />
          <span className="ml-auto muted hidden sm:inline">
            {staff.nombre ?? user.email} · {staff.rol === "admin" ? "Administrador" : "Técnico"}
          </span>
          <BotonTema inicial={oscuro} />
          <Link href="/taller/mi-clave" className="muted hover:underline">Mi clave</Link>
          <form action={salir}><button className="muted hover:underline">Salir</button></form>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
