import Image from "next/image";
import Link from "next/link";
import logo from "../../public/logo.png";
import { SiteHeader } from "@/components/SiteHeader";
import { PildorasSecciones } from "@/components/PildorasSecciones";
import { TarjetasPromo } from "@/components/TarjetasPromo";
import { TarjetaUsado } from "@/components/TarjetaUsado";
import { TarjetaCaso } from "@/components/TarjetaCaso";
import { createAdminClient } from "@/lib/supabase/admin";
import { datosNuestrosClientes } from "@/lib/nuestros-clientes";
import { estrellas } from "@/lib/casos";
import type { Usado } from "@/lib/usados";

export const revalidate = 120;

const SERVICIOS = [
  { t: "Puesta a punto", d: "Ajuste de alma, altura de cuerdas, octavación y limpieza general." },
  { t: "Calibración", d: "Tu instrumento cómodo y afinado en todo el diapasón." },
  { t: "Reparaciones", d: "Electrónica, trastes, clavijas, puentes y más." },
  { t: "Insumos", d: "Cuerdas, limpiadores, repuestos y accesorios." },
];

function Titulo({ t, href }: { t: string; href: string }) {
  return (
    <div className="flex items-end justify-between">
      <h2 className="text-2xl font-semibold">{t}</h2>
      <Link href={href} className="font-semibold" style={{ color: "var(--accent)" }}>Ver todo →</Link>
    </div>
  );
}

export default async function Home() {
  const db = createAdminClient();
  const [{ data: usadosData }, { data: liqData }, nc] = await Promise.all([
    db.from("usados").select("*").eq("estado", "publicado").neq("seccion", "liquidacion").order("destacado", { ascending: false }).order("publicado_en", { ascending: false }).limit(4),
    db.from("usados").select("*").eq("estado", "publicado").eq("seccion", "liquidacion").order("publicado_en", { ascending: false }).limit(4),
    datosNuestrosClientes(3),
  ]);
  const usados = (usadosData ?? []) as Usado[];
  const liquidacion = (liqData ?? []) as Usado[];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-14 px-4 pb-8">
        <section className="grid items-center gap-10 pt-10 sm:pt-14 lg:grid-cols-[1.1fr_1fr]">
          <Image src={logo} alt="Música Música Web" priority sizes="(min-width: 1024px) 520px, 100vw" className="h-auto w-full max-w-[560px]" />
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--accent)" }}>Taller de instrumentos · Usados · Insumos</p>
            <h1 className="text-3xl sm:text-5xl font-semibold leading-tight">Tu instrumento en buenas manos. Y vos, al tanto de cada paso.</h1>
            <p className="muted text-lg">Preparamos, calibramos y reparamos instrumentos musicales. Seguís el avance online, con fotos y videos.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/asesor" className="btn !px-6 !py-3 text-base">Asesorame</Link>
              <Link href="/mi-cuenta" className="btn-ghost !px-6 !py-3 text-base">Ver mi instrumento</Link>
            </div>
          </div>
        </section>

        <div className="flex justify-center"><PildorasSecciones href={(s) => (s ? `/usados?seccion=${s}` : "/usados")} /></div>

        <TarjetasPromo />

        {liquidacion.length > 0 && (
          <section className="space-y-4">
            <Titulo t="Liquidación" href="/usados?seccion=liquidacion" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{liquidacion.map((u) => <TarjetaUsado key={u.id} u={u} />)}</div>
          </section>
        )}

        {usados.length > 0 && (
          <section className="space-y-4">
            <Titulo t="Usados revisados en el taller" href="/usados" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{usados.map((u) => <TarjetaUsado key={u.id} u={u} />)}</div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Qué hacemos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICIOS.map((s) => (
              <div key={s.t} className="card space-y-1 border-t-4" style={{ borderTopColor: "var(--accent)" }}>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="muted text-sm">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {nc.casos.length > 0 && (
          <section className="space-y-4">
            <Titulo t="Nuestros clientes" href="/nuestros-clientes" />
            {nc.promedio && <p><span style={{ color: "#f5b301" }}>{estrellas(Math.round(nc.promedio))}</span> <b>{nc.promedio.toFixed(1)}</b> <span className="muted">· {nc.resenas.length} opiniones</span></p>}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {nc.casos.map((c) => <TarjetaCaso key={c.id} c={c} r={nc.resenas.find((r) => r.id === c.resena_id)} />)}
            </div>
          </section>
        )}

        <section className="card grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">¿Ya dejaste tu instrumento?</h2>
            <p className="muted">Entrá con tu código de cliente o abrí el link que te mandamos por WhatsApp para ver en qué etapa está.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/mi-cuenta" className="btn">Entrar a mi cuenta</Link>
            <Link href="/registro" className="btn-ghost">Registrarme</Link>
          </div>
        </section>
      </main>
    </>
  );
}
