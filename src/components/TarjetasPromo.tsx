import Link from "next/link";

const PROMOS = [
  {
    titulo: "Entregá tu usado en parte de pago",
    texto: "Tomamos tu instrumento como parte de pago y te llevás otro. Mandanos fotos y te pasamos la tasación.",
    cta: "Cotizar mi usado",
    href: "/usados/vender?quiere=permutar",
    pie: "Respuesta rápida · sin compromiso",
    icono: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
    ),
  },
  {
    titulo: "¿Ya te pasaron un presupuesto?",
    texto: "De un instrumento o de una reparación: mandanos la foto, lo analizamos y te hacemos nuestra mejor propuesta.",
    cta: "Enviar presupuesto",
    href: "/mejor-precio",
    pie: "Revisado por el taller, no por un bot",
    icono: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15l2 2 4-4" /></svg>
    ),
  },
];

/** Las dos tarjetas negras con brillo rojo: permuta y mejoramos tu presupuesto. */
export function TarjetasPromo() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {PROMOS.map((p) => (
        <div key={p.titulo} className="relative overflow-hidden rounded-3xl bg-zinc-950 p-7 text-white sm:p-9">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(229,0,0,.55), transparent 65%)" }} />
          <div className="relative space-y-3">
            <span className="inline-grid h-12 w-12 place-items-center rounded-xl" style={{ background: "rgba(229,0,0,.15)", color: "#ff4d4d" }}>{p.icono}</span>
            <h2 className="text-2xl font-bold">{p.titulo}</h2>
            <p className="max-w-md text-zinc-300">{p.texto}</p>
            <Link href={p.href} className="btn !bg-red-600 !text-white !px-6 !py-3 text-base font-bold">{p.cta} →</Link>
            <p className="text-sm text-zinc-400">{p.pie}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
