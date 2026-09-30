import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_PEDIDO, PAGOS, pesos } from "@/lib/tienda";
import { formatoFechaHora, linkWhatsApp, siteUrl } from "@/lib/estados";
import { cancelar, cotizarEnvio, datosInternos, estadoPedido, marcarPagado } from "../actions";

export default async function PedidoTallerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase.from("pedidos").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  const { data: items } = await supabase.from("pedido_items").select("*").eq("pedido_id", id);
  const e = ESTADOS_PEDIDO[p.estado];
  const link = `${siteUrl()}/pedido/${p.token}`;
  const msg = p.estado === "a_cotizar"
    ? `Hola ${p.nombre}! Ya cotizamos el envío de tu pedido ${p.numero}. Podés pagarlo acá: ${link}`
    : `Hola ${p.nombre}! Te escribimos por tu pedido ${p.numero} (${e.label}). Detalle: ${link}`;
  const siguientes = p.envio_tipo === "retiro" ? ["preparando", "listo_retirar", "entregado"] : ["preparando", "enviado", "entregado"];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <Link href="/taller/pedidos" className="muted text-sm hover:underline">← Pedidos</Link>
          <h1 className="text-2xl font-semibold">Pedido <span className="font-mono">{p.numero}</span></h1>
          <p className="muted text-sm">{formatoFechaHora(p.creado_en)}</p>
        </div>
        <span className={`badge ${e.color}`}>{e.label}</span>
        <a href={linkWhatsApp(p.telefono, msg)} target="_blank" rel="noreferrer" className="btn">WhatsApp al cliente</a>
        <a href={link} target="_blank" rel="noreferrer" className="btn-ghost">Ver como cliente</a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-4">
          <div className="card space-y-2">
            <h2 className="font-semibold">Productos</h2>
            <ul className="space-y-1 text-sm">{(items ?? []).map((i) => <li key={i.id} className="flex justify-between gap-2"><span>{i.cantidad} × {i.nombre}</span><span>{pesos(i.precio * i.cantidad)}</span></li>)}</ul>
            <div className="space-y-1 border-t pt-2 text-sm" style={{ borderColor: "var(--line)" }}>
              <div className="flex justify-between"><span>Subtotal</span><span>{pesos(p.subtotal)}</span></div>
              {Number(p.descuento) > 0 && <div className="flex justify-between"><span>Descuento</span><span>−{pesos(p.descuento)}</span></div>}
              <div className="flex justify-between"><span>Envío</span><span>{p.envio_costo == null ? "A coordinar" : pesos(p.envio_costo)}</span></div>
              <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{pesos(p.total)}</span></div>
            </div>
          </div>
          <div className="card grid gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
            <span className="muted">Cliente</span><span>{p.nombre}{p.dni ? ` · DNI ${p.dni}` : ""}</span>
            <span className="muted">Contacto</span><span>{p.telefono}{p.email ? ` · ${p.email}` : ""}</span>
            <span className="muted">Entrega</span><span>{p.envio_nombre}</span>
            {p.direccion && <><span className="muted">Dirección</span><span>{[p.direccion, p.localidad, p.provincia, p.codigo_postal].filter(Boolean).join(", ")}</span></>}
            <span className="muted">Pago</span><span>{PAGOS[p.pago_metodo]} · {p.pago_estado}{p.mp_payment_id ? ` (MP #${p.mp_payment_id})` : ""}</span>
            {p.notas && <><span className="muted">Nota del cliente</span><span>{p.notas}</span></>}
          </div>
        </section>

        <aside className="space-y-4">
          {p.estado === "a_cotizar" && (
            <form action={cotizarEnvio.bind(null, p.id)} className="card space-y-2">
              <h2 className="font-semibold">Cotizar envío por correo</h2>
              <label className="field"><span>Costo del envío ($)</span><input name="costo" inputMode="decimal" required /></label>
              <button className="btn w-full">Guardar costo</button>
              <p className="muted text-xs">Después mandale el link por WhatsApp para que pague.</p>
            </form>
          )}
          {p.pago_estado !== "aprobado" && p.estado !== "cancelado" && (
            <form action={marcarPagado.bind(null, p.id)} className="card space-y-2">
              <h2 className="font-semibold">Pago</h2>
              <p className="muted text-xs">Usalo cuando recibís la transferencia o cobrás en efectivo. Mercado Pago se confirma solo.</p>
              <button className="btn w-full">Marcar como pagado</button>
            </form>
          )}
          {p.estado !== "cancelado" && (
            <div className="card space-y-2">
              <h2 className="font-semibold">Avanzar pedido</h2>
              <div className="flex flex-wrap gap-2">
                {siguientes.filter((s) => s !== p.estado).map((s) => (
                  <form key={s} action={estadoPedido.bind(null, p.id, s)}><button className="btn-ghost !py-1.5 text-sm">{ESTADOS_PEDIDO[s].label}</button></form>
                ))}
              </div>
            </div>
          )}
          <form action={datosInternos.bind(null, p.id)} className="card space-y-2">
            <label className="field"><span>N° de seguimiento del envío</span><input name="seguimiento" defaultValue={p.seguimiento_envio ?? ""} /></label>
            <label className="field"><span>Notas internas</span><textarea name="notas_internas" rows={2} defaultValue={p.notas_internas ?? ""} /></label>
            <button className="btn-ghost w-full">Guardar</button>
          </form>
          {p.estado !== "cancelado" && (
            <form action={cancelar.bind(null, p.id)} className="text-right">
              <button className="text-sm text-red-600 hover:underline">Cancelar pedido y devolver stock</button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
