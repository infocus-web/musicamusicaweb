import Image from "next/image";
import Link from "next/link";
import logo from "../../public/logo.png";

const SERVICIOS = [
  { t: "Puesta a punto", d: "Ajuste de alma, altura de cuerdas, octavación y limpieza general." },
  { t: "Calibración", d: "Tu instrumento cómodo y afinado en todo el diapasón." },
  { t: "Reparaciones", d: "Electrónica, trastes, clavijas, puentes y más." },
  { t: "Insumos", d: "Cuerdas, limpiadores, repuestos y accesorios." },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4">
      <header className="flex items-center justify-end gap-5 py-5 text-sm">
        <Link href="/registro" className="hover:underline">Registrate</Link>
        <Link href="/mi-cuenta" className="hover:underline">Mi cuenta</Link>
        <Link href="/login" className="muted hover:underline">Acceso taller</Link>
      </header>

      <section className="grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[1.1fr_1fr]">
        <Image
          src={logo}
          alt="Música Música Web"
          priority
          sizes="(min-width: 1024px) 520px, 100vw"
          className="h-auto w-full max-w-[560px]"
        />
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--accent)" }}>Taller de instrumentos · Insumos</p>
          <h1 className="text-3xl sm:text-5xl font-semibold leading-tight">
            Tu instrumento en buenas manos. Y vos, al tanto de cada paso.
          </h1>
          <p className="muted text-lg">
            Preparamos, calibramos y reparamos instrumentos musicales. Cada cliente recibe un link privado para ver el estado de su trabajo, con fotos y videos del avance.
          </p>
        </div>
      </section>

      <section className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICIOS.map((s) => (
          <div key={s.t} className="card space-y-1 border-t-4" style={{ borderTopColor: "var(--accent)" }}>
            <h2 className="font-semibold">{s.t}</h2>
            <p className="muted text-sm">{s.d}</p>
          </div>
        ))}
      </section>

      <section className="card mb-16 space-y-2">
        <h2 className="text-xl font-semibold">¿Ya dejaste tu instrumento?</h2>
        <p className="muted">Abrí el link que te mandamos por WhatsApp, o entrá con tu código de cliente y tu clave para ver en qué etapa está y los videos del trabajo.</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/mi-cuenta" className="btn">Entrar a mi cuenta</Link>
          <Link href="/registro" className="btn-ghost">Registrarme como cliente</Link>
        </div>
      </section>

      <footer className="muted border-t py-6 text-sm" style={{ borderColor: "var(--line)" }}>
        © {new Date().getFullYear()} Música Música Web · musicamusicaweb.com.ar
      </footer>
    </main>
  );
}
