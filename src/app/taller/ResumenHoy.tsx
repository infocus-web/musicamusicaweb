import Link from "next/link";
import { appWhatsApp, linkSeguimiento } from "@/lib/estados";

export type Listo = { id: string; numero: string; instrumento: string; cliente: string; telefono: string | null; token: string; dias: number | null };
export type Atrasado = { id: string; numero: string; instrumento: string; cliente: string; estimada: string; dias: number };
export type Cifras = { enTaller: number; listos: number; pedidos: number; consultas: number; chat: number; avisos: number; turnosHoy: number; turnosPedidos: number };

/** Inicio del panel: lo que hay que hacer hoy, de un vistazo. */
export function ResumenHoy({ cifras, listos, atrasados }: { cifras: Cifras; listos: Listo[]; atrasados: Atrasado[] }) {
  const tarjetas = [
    { n: cifras.enTaller, t: "En el taller", d: "Trabajos en curso", href: "#tablero" },
    { n: cifras.avisos, t: "Avisos por WhatsApp", d: "Clientes a los que avisar", href: "/taller/avisos", alerta: cifras.avisos > 0 },
    { n: cifras.turnosHoy, t: "Turnos de hoy", d: cifras.turnosPedidos ? `${cifras.turnosPedidos} pedido(s) por confirmar` : "Agenda", href: "/taller/turnos", alerta: cifras.turnosPedidos > 0 },
    { n: cifras.listos, t: "Listos para retirar", d: "Esperando al cliente", href: "#listos", alerta: listos.some((l) => (l.dias ?? 0) >= 30) },
    { n: cifras.pedidos, t: "Pedidos para atender", d: "Sin pagar o por preparar", href: "/taller/pedidos", alerta: cifras.pedidos > 0 },
    { n: cifras.chat, t: "Mensajes sin leer", d: "Chat con clientes", href: "/taller/mensajes", alerta: cifras.chat > 0 },
    { n: cifras.consultas, t: "Consultas nuevas", d: "Tasaciones y arrepentimientos", href: "/taller/consultas", alerta: cifras.consultas > 0 },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hoy en el taller</h1>
        <p className="muted text-sm">Lo que necesita tu atención. Tocá una tarjeta para ir directo.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tarjetas.map((c) => (
          <Link key={c.t} href={c.href} className="card !p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            style={c.alerta ? { borderColor: "var(--accent)" } : undefined}>
            <p className="text-3xl font-bold" style={c.alerta ? { color: "var(--accent)" } : undefined}>{c.n}</p>
            <p className="font-semibold">{c.t}</p>
            <p className="muted text-xs">{c.d}</p>
          </Link>
        ))}
      </section>

      {atrasados.length > 0 && (
        <section className="card space-y-2" style={{ borderColor: "#f59e0b" }}>
          <h2 className="font-semibold">⏰ Atrasados (pasó la fecha estimada)</h2>
          <ul className="divide-y text-sm">
            {atrasados.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-2" style={{ borderColor: "var(--line)" }}>
                <Link href={`/taller/trabajos/${a.id}`} className="link font-mono font-semibold">{a.numero}</Link>
                <span className="flex-1">{a.instrumento} · <span className="muted">{a.cliente}</span></span>
                <span className="text-xs font-semibold text-amber-600">{a.dias} día{a.dias === 1 ? "" : "s"} de atraso</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {listos.length > 0 && (
        <section id="listos" className="card space-y-3">
          <h2 className="font-semibold">Listos para retirar</h2>
          <p className="muted text-xs">Según tus términos: a los 30 días se cobra guarda y a los 90 se considera abandonado.</p>
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {listos.map((l) => {
              const d = l.dias ?? 0;
              const estado = d >= 90 ? { t: `${d} días · abandonado`, c: "bg-red-100 text-red-700" } : d >= 30 ? { t: `${d} días · cobra guarda`, c: "bg-amber-100 text-amber-800" } : { t: d === 0 ? "hoy" : `hace ${d} día${d === 1 ? "" : "s"}`, c: "bg-zinc-200 text-zinc-700" };
              const msg = d >= 30
                ? `Hola ${l.cliente.split(" ")[0]}! Te recordamos que tu ${l.instrumento} (orden ${l.numero}) está listo hace ${d} días. Pasados los 30 días se cobra guarda. ¿Coordinamos el retiro? ${linkSeguimiento(l.token)}`
                : `Hola ${l.cliente.split(" ")[0]}! Tu ${l.instrumento} (orden ${l.numero}) ya está listo para retirar. ¿Coordinamos el horario? Detalle: ${linkSeguimiento(l.token)}`;
              return (
                <li key={l.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm" style={{ borderColor: "var(--line)" }}>
                  <Link href={`/taller/trabajos/${l.id}`} className="link font-mono font-semibold">{l.numero}</Link>
                  <span className="flex-1">{l.instrumento} · <span className="muted">{l.cliente}</span></span>
                  <span className={`badge ${estado.c}`}>{estado.t}</span>
                  <a className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ background: "#25D366" }}
                    href={appWhatsApp(l.telefono, msg)}>{d >= 30 ? "Recordar retiro" : "Avisar"}</a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
