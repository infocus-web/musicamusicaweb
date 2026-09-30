import Link from "next/link";

const SERVICIOS = [
  { t: "Puesta a punto", d: "Ajuste de alma, altura de cuerdas, octavación y limpieza general." },
  { t: "Calibración", d: "Tu instrumento cómodo y afinado en todo el diapasón." },
  { t: "Reparaciones", d: "Electrónica, trastes, clavijas, puentes y más." },
  { t: "Insumos", d: "Cuerdas, limpiadores, repuestos y accesorios." },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4">
      <header className="flex items-center justify-between py-5">
        <span className="font-semibold">Musica Musica</span>
        <Link href="/login" className="muted text-sm hover:underline">Acceso taller</Link>
      </header>

      <section className="py-16 sm:py-24 space-y-5">
        <p className="text-xs uppercase tracking-widest muted">Taller de instrumentos · Insumos</p>
        <h1 className="text-4xl sm:text-6xl font-semibold leading-tight max-w-3xl">
          Tu instrumento en buenas manos. Y vos, al tanto de cada paso.
        </h1>
        <p className="muted max-w-xl text-lg">
          Preparamos, calibramos y reparamos instrumentos musicales. Cada cliente recibe un link privado para ver el estado de su trabajo, con fotos y videos del avance.
        </p>
      </section>

      <section className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICIOS.map((s) => (
          <div key={s.t} className="card space-y-1">
            <h2 className="font-semibold">{s.t}</h2>
            <p className="muted text-sm">{s.d}</p>
          </div>
        ))}
      </section>

      <section className="card mb-16 space-y-2">
        <h2 className="text-xl font-semibold">¿Ya dejaste tu instrumento?</h2>
        <p className="muted">Abrí el link que te mandamos por WhatsApp para ver en qué etapa está y los videos del trabajo.</p>
      </section>

      <footer className="muted border-t py-6 text-sm" style={{ borderColor: "var(--line)" }}>
        © {new Date().getFullYear()} Musica Musica · musicamusicaweb.com.ar
      </footer>
    </main>
  );
}
