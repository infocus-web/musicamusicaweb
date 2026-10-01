import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerStaff } from "@/lib/auth";
import { salir } from "../login/actions";
import { Logo } from "@/components/Logo";
import { cookies } from "next/headers";
import { BotonTema } from "./BotonTema";

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
          <Link href="/taller" className="muted hover:underline">Trabajos</Link>
          <Link href="/taller/clientes" className="muted hover:underline">Clientes</Link>
          <Link href="/taller/tienda" className="muted hover:underline">Tienda</Link>
          <Link href="/taller/pedidos" className="muted hover:underline">Pedidos</Link>
          <Link href="/taller/usados" className="muted hover:underline">Usados</Link>
          <Link href="/taller/consultas" className="muted hover:underline">Consultas</Link>
          <Link href="/taller/nuestros-clientes" className="muted hover:underline">Nuestros clientes</Link>
          <Link href="/taller/imagenes" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>Imágenes y videos</Link>
          {staff.rol === "admin" && <Link href="/taller/equipo" className="muted hover:underline">Equipo</Link>}
          {staff.rol === "admin" && <Link href="/taller/ajustes" className="muted hover:underline">Ajustes</Link>}
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
