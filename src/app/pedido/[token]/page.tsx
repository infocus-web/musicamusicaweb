import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAjustes, waTaller } from "@/lib/ajustes";
import { buscarPagoDePedido, mpActivo } from "@/lib/mercadopago";
import { aplicarPagoMP } from "@/lib/pedidos";
import { ESTADOS_PEDIDO, PAGOS, pesos } from "@/lib/tienda";
import { formatoFechaHora } from "@/lib/estados";
import { SiteHeader } from "@/components/SiteHeader";
import { pagarConMP } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tu pedido — Música Música Web", robots: { index: false } };

export default async function PedidoPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ mp?: string; nuevo?: string }> }) {
  const { token } = await params;
  const { mp, nuevo } = await searchParams;
  if (!/^[a-f0-9]{32}$/.test(token)) notFound();
  const db = createAdminClient();
  let { data: p } = await db.from("pedidos").select("*").eq("token", token).maybeSingle();
  if (!p) notFound();

  // Si volvió de Mercado Pago y el aviso todavía no llegó, lo consultamos nosotros.
  if (p.pago_metodo === "mercadopago" && p.pago_estado !== "aprobado" && mpActivo()) {
    const pago = await buscarPagoDePedido(p.id);
    if (pago) {
      await aplicarPagoMP(pago);
      p = (await db.from("pedidos").select("*").eq("token", token).single()).data!;
    }
  }

  const { data: items } = await db.from("pedido_items").select("*").eq("pedido_id", p.id);
  const a = await obtenerAjustes();
  const est = ESTADOS_PEDIDO[p.estado] ?? ESTADOS_PEDIDO.pendiente;
  const pagado = p.pago_estado === "aprobado";
  const wa = waTaller(a.whatsapp, `Hola! Te escribo por mi pedido ${p.numero}.`);
  const waComprobante = waTaller(a.whatsapp, `Hola! Te mando el comprobante de la transferencia del pedido ${p.numero} (${pesos(p.total)}).`);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {nuevo && <div className="rounded-xl p-4" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}><b>¡Gracias, {p.nombre.split(" ")[0]}!</b> Recibimos tu pedido. Guardá este link para ver cómo avanza.</div>}
        {mp === "ok" && pagado && <div className="rounded-xl bg-emerald-100 p-4 text-emerald-900">¡Pago aprobado! Ya estamos preparando tu pedido.</div>}
        {mp === "error" && !pagado && <div className="rounded-xl bg-red-100 p-4 text-red-800">El pago no se completó. Podés intentar de nuevo o elegir transferencia.</div>}

        <header className="flex flex-wrap items-center gap-3">
          <h1 className="mr-auto text-3xl font-semibold">Pedido <span className="font-mono">{p.numero}</span></h1>
          <span className={`badge ${est.color}`}>{est.label}</span>
        </header>
        <p className="muted text-sm">{formatoFechaHora(p.creado_en)} · {PAGOS[p.pago_metodo]} · {p.envio_nombre}</p>

        {p.estado === "a_cotizar" && <div className="card">Estamos cotizando el envío por correo. Te escribimos por WhatsApp con el costo y el link para pagar.</div>}

        {!pagado && p.estado === "pendiente" && p.pago_metodo === "mercadopago" && mpActivo() && (
          <form action={pagarConMP.bind(null, p.token)} className="card flex flex-wrap items-center gap-3">
            <p className="mr-auto">Falta el pago de <b>{pesos(p.total)}</b>.</p>
            <button className="btn">Pagar con Mercado Pago</button>
          </form>
        )}
        {!pagado && p.estado === "pendiente" && p.pago_metodo === "transferencia" && (
          <section className="card space-y-3">
            <h2 className="font-semibold">Datos para transferir {pesos(p.total)}</h2>
            {a.transferencia_datos ? <pre className="whitespace-pre-wrap rounded-xl p-3 font-mono text-sm" style={{ background: "var(--bg)" }}>{a.transferencia_datos}</pre>
              : <p className="muted text-sm">Te mandamos los datos por WhatsApp.</p>}
            <p className="text-sm">Usá como referencia <b>{p.numero}</b>. Reservamos el pedido por 48 h.</p>
            {waComprobante && <a href={waComprobante} target="_blank" rel="noreferrer" className="btn">Enviar comprobante por WhatsApp</a>}
          </section>
        )}
        {!pagado && p.estado === "pendiente" && p.pago_metodo === "efectivo" && (
          <p className="card">Te avisamos por WhatsApp cuando esté listo. Pagás {pesos(p.total)} en efectivo al retirar.</p>
        )}

        <section className="card space-y-2">
          <h2 className="font-semibold">Detalle</h2>
          <ul className="space-y-1 text-sm">
            {(items ?? []).map((i) => <li key={i.id} className="flex justify-between gap-2"><span>{i.cantidad} × {i.nombre}</span><span>{pesos(i.precio * i.cantidad)}</span></li>)}
          </ul>
          <div className="space-y-1 border-t pt-2 text-sm" style={{ borderColor: "var(--line)" }}>
            <div className="flex justify-between"><span>Subtotal</span><span>{pesos(p.subtotal)}</span></div>
            {Number(p.descuento) > 0 && <div className="flex justify-between"><span>Descuento</span><span>−{pesos(p.descuento)}</span></div>}
            <div className="flex justify-between"><span>Envío</span><span>{p.envio_costo == null ? "A coordinar" : Number(p.envio_costo) ? pesos(p.envio_costo) : "Gratis"}</span></div>
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{pesos(p.total)}</span></div>
          </div>
          {p.direccion && <p className="muted text-sm">Entrega en: {[p.direccion, p.localidad, p.provincia, p.codigo_postal].filter(Boolean).join(", ")}</p>}
          {p.seguimiento_envio && <p className="text-sm">Seguimiento del envío: <b>{p.seguimiento_envio}</b></p>}
        </section>

        <div className="flex flex-wrap gap-2">
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost">Consultar por WhatsApp</a>}
          <Link href="/tienda" className="btn-ghost">Seguir comprando</Link>
          <Link href="/arrepentimiento" className="muted self-center text-sm hover:underline">Botón de arrepentimiento</Link>
        </div>
      </main>
    </>
  );
}
