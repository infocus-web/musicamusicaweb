"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCarrito } from "@/components/Carrito";
import { pesos } from "@/lib/tienda";
import { crearPedido } from "./actions";

type Envio = { id: string; nombre: string; tipo: string; precio: number; gratis_desde: number | null; detalle: string | null };

export function Checkout({ envios, mp, descuentoTransferencia }: { envios: Envio[]; mp: boolean; descuentoTransferencia: number }) {
  const { items, subtotal, vaciar, listo } = useCarrito();
  const [envioId, setEnvioId] = useState(envios[0]?.id ?? "");
  const [pago, setPago] = useState(mp ? "mercadopago" : "transferencia");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const envio = envios.find((e) => e.id === envioId);
  const costoEnvio = useMemo(() => {
    if (!envio) return 0;
    if (envio.tipo === "fijo") return envio.gratis_desde && subtotal >= envio.gratis_desde ? 0 : Number(envio.precio);
    return 0;
  }, [envio, subtotal]);
  const pendienteEnvio = envio && (envio.tipo === "correo" || envio.tipo === "moto");
  const descuento = pago === "transferencia" ? Math.round((subtotal * descuentoTransferencia) / 100) : 0;
  const total = subtotal - descuento + costoEnvio;
  const necesitaDireccion = envio && envio.tipo !== "retiro";

  if (!listo) return null;
  if (items.length === 0) return <div className="card text-center space-y-3"><p className="muted">Tu carrito está vacío.</p><Link href="/tienda" className="btn">Ir a la tienda</Link></div>;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setEnviando(true);
    const fd = new FormData(e.currentTarget);
    fd.set("envio_id", envioId); fd.set("pago", pago);
    try {
      const r = await crearPedido(items.map((i) => ({ tipo: i.tipo, id: i.id, varianteId: i.varianteId, cantidad: i.cantidad })), fd);
      if ("error" in r) { setError(r.error); setEnviando(false); return; }
      vaciar();
      window.location.href = r.redirigir;
    } catch {
      setError("Algo falló. Probá de nuevo."); setEnviando(false);
    }
  }

  const Opcion = ({ activo, onClick, titulo, detalle, derecha }: { activo: boolean; onClick: () => void; titulo: string; detalle?: string | null; derecha?: string }) => (
    <button type="button" onClick={onClick} className="flex w-full items-start gap-3 rounded-xl border p-3 text-left"
      style={{ borderColor: activo ? "var(--accent)" : "var(--line)", background: activo ? "color-mix(in srgb, var(--accent) 8%, var(--card))" : "var(--card)" }}>
      <span className="mt-1 h-4 w-4 shrink-0 rounded-full border-4" style={{ borderColor: activo ? "var(--accent)" : "var(--line)" }} />
      <span className="flex-1"><span className="font-medium">{titulo}</span>{detalle && <span className="muted block text-sm">{detalle}</span>}</span>
      {derecha && <span className="text-sm font-medium">{derecha}</span>}
    </button>
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="space-y-6">
        <section className="card grid gap-3 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">1. Tus datos</h2>
          <label className="field sm:col-span-2"><span>Nombre y apellido *</span><input name="nombre" required autoComplete="name" /></label>
          <label className="field"><span>WhatsApp *</span><input name="telefono" required inputMode="tel" autoComplete="tel" /></label>
          <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" /></label>
          <label className="field"><span>DNI (para la factura)</span><input name="dni" inputMode="numeric" /></label>
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">2. Entrega</h2>
          {envios.map((e) => (
            <Opcion key={e.id} activo={e.id === envioId} onClick={() => { setEnvioId(e.id); if (e.tipo !== "retiro" && pago === "efectivo") setPago(mp ? "mercadopago" : "transferencia"); }}
              titulo={e.nombre} detalle={e.detalle}
              derecha={e.tipo === "retiro" ? "Gratis" : e.tipo === "fijo" ? (e.gratis_desde && subtotal >= e.gratis_desde ? "Gratis" : pesos(e.precio)) : "A cotizar"} />
          ))}
          {necesitaDireccion && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field sm:col-span-2"><span>Dirección *</span><input name="direccion" required autoComplete="street-address" /></label>
              <label className="field"><span>Localidad *</span><input name="localidad" required autoComplete="address-level2" /></label>
              <label className="field"><span>Provincia{envio?.tipo === "correo" ? " *" : ""}</span><input name="provincia" required={envio?.tipo === "correo"} autoComplete="address-level1" /></label>
              <label className="field"><span>Código postal{envio?.tipo === "correo" ? " *" : ""}</span><input name="codigo_postal" required={envio?.tipo === "correo"} autoComplete="postal-code" /></label>
            </div>
          )}
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">3. Pago</h2>
          {mp && <Opcion activo={pago === "mercadopago"} onClick={() => setPago("mercadopago")} titulo="Mercado Pago" detalle="Tarjetas de crédito y débito, cuotas, dinero en cuenta." />}
          <Opcion activo={pago === "transferencia"} onClick={() => setPago("transferencia")} titulo={`Transferencia bancaria${descuentoTransferencia ? ` (${descuentoTransferencia}% OFF)` : ""}`} detalle="Te mostramos los datos al confirmar el pedido." />
          {envio?.tipo === "retiro" && <Opcion activo={pago === "efectivo"} onClick={() => setPago("efectivo")} titulo="Efectivo al retirar" detalle="Te reservamos el pedido y pagás en el local." />}
          <label className="field"><span>¿Algo que debamos saber? (opcional)</span><textarea name="notas" rows={2} /></label>
        </section>
      </div>

      <aside className="card h-fit space-y-3 lg:sticky lg:top-4">
        <h2 className="font-semibold">Resumen</h2>
        <ul className="space-y-1 text-sm">
          {items.map((i) => <li key={i.clave} className="flex justify-between gap-2"><span className="truncate">{i.cantidad} × {i.nombre}</span><span>{pesos(i.precio * i.cantidad)}</span></li>)}
        </ul>
        <div className="space-y-1 border-t pt-2 text-sm" style={{ borderColor: "var(--line)" }}>
          <div className="flex justify-between"><span>Subtotal</span><span>{pesos(subtotal)}</span></div>
          {descuento > 0 && <div className="flex justify-between" style={{ color: "var(--accent)" }}><span>Descuento transferencia</span><span>−{pesos(descuento)}</span></div>}
          <div className="flex justify-between"><span>Envío</span><span>{pendienteEnvio ? "A cotizar" : costoEnvio ? pesos(costoEnvio) : "Gratis"}</span></div>
        </div>
        <div className="flex justify-between border-t pt-2 text-lg font-semibold" style={{ borderColor: "var(--line)" }}><span>Total</span><span>{pesos(total)}{pendienteEnvio ? " + envío" : ""}</span></div>
        {envio?.tipo === "correo" && <p className="muted text-xs">Te pasamos el costo del correo por WhatsApp y después pagás el total.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full !py-3 text-base" disabled={enviando}>
          {enviando ? "Procesando…" : pago === "mercadopago" && envio?.tipo !== "correo" ? "Pagar con Mercado Pago" : "Confirmar pedido"}
        </button>
        <p className="muted text-xs">Al confirmar aceptás los <Link href="/terminos" className="link">términos y condiciones</Link>. Tenés 10 días para arrepentirte de la compra.</p>
      </aside>
    </form>
  );
}
