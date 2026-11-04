import Link from "next/link";
import { appWhatsApp, linkSeguimiento } from "@/lib/estados";

export type Listo = { id: string; numero: string; instrumento: string; cliente: string; telefono: string | null; token: string };
export type Cifras = { enTaller: number; listos: number; pedidos: number; consultas: number };

/** Inicio del panel: lo que hay que hacer hoy, de un vistazo. */
export function ResumenHoy({ cifras, listos }: { cifras: Cifras; listos: Listo[] }) {
  const tarjetas = [
    { n: cifras.enTaller, t: "En el taller", d: "Trabajos en curso", href: "#tablero" },
    { n: cifras.listos, t: "Listos para retirar", d: "Avisale al cliente", href: "#listos", alerta: cifras.listos > 0 },
    { n: cifras.pedidos, t: "Pedidos para atender", d: "Sin pagar o por preparar", href: "/taller/pedidos", alerta: cifras.pedidos > 0 },
    { n: cifras.consultas, t: "Consultas nuevas", d: "Tasaciones y arrepentimientos", href: "/taller/consultas", alerta: cifras.consultas > 0 },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hoy en el taller</h1>
        <p className="muted text-sm">Lo que necesita tu atención. Tocá una tarjeta para ir directo.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tarjetas.map((c) => (
          <Link key={c.t} href={c.href} className="card !p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            style={c.alerta ? { borderColor: "var(--accent)" } : undefined}>
            <p className="text-3xl font-bold" style={c.alerta ? { color: "var(--accent)" } : undefined}>{c.n}</p>
            <p className="font-semibold">{c.t}</p>
            <p className="muted text-xs">{c.d}</p>
          </Link>
        ))}
      </section>

      {listos.length > 0 && (
        <section id="listos" className="card space-y-3">
          <h2 className="font-semibold">Listos para retirar: avisale al cliente</h2>
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {listos.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm" style={{ borderColor: "var(--line)" }}>
                <Link href={`/taller/trabajos/${l.id}`} className="link font-mono font-semibold">{l.numero}</Link>
                <span className="flex-1">{l.instrumento} · <span className="muted">{l.cliente}</span></span>
                <a className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ background: "#25D366" }}
                  href={appWhatsApp(l.telefono, `Hola ${l.cliente.split(" ")[0]}! Tu ${l.instrumento} (orden ${l.numero}) ya está listo para retirar. Coordinamos el horario? Detalle: ${linkSeguimiento(l.token)}`)}>
                  Avisar por WhatsApp
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
