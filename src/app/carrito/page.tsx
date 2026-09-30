"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCarrito } from "@/components/Carrito";
import { SiteHeaderCliente } from "@/components/SiteHeaderCliente";
import { pesos } from "@/lib/tienda";

export default function CarritoPage() {
  const { items, subtotal, cambiar, quitar, listo } = useCarrito();
  return (
    <>
      <SiteHeaderCliente />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <h1 className="titulo text-4xl">Tu carrito</h1>
        {!listo ? null : items.length === 0 ? (
          <div className="card space-y-3 text-center">
            <p className="muted">El carrito está vacío.</p>
            <div className="flex justify-center gap-2"><Link href="/tienda" className="btn">Ir a la tienda</Link><Link href="/usados" className="btn-ghost">Ver usados</Link></div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.clave} className="card flex gap-3 !p-3">
                  <Link href={i.href} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
                    {i.foto && <img src={i.foto} alt="" className="h-full w-full object-contain" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Link href={i.href} className="font-medium leading-snug hover:underline">{i.nombre}</Link>
                    <div className="mt-auto flex flex-wrap items-center gap-3">
                      {i.max === 1 ? <span className="muted text-sm">Unidad única</span> : (
                        <div className="flex items-center rounded-xl border text-sm" style={{ borderColor: "var(--line)" }}>
                          <button className="px-3 py-1" onClick={() => cambiar(i.clave, i.cantidad - 1)} aria-label="Menos">−</button>
                          <span className="w-8 text-center">{i.cantidad}</span>
                          <button className="px-3 py-1" onClick={() => cambiar(i.clave, i.cantidad + 1)} aria-label="Más">+</button>
                        </div>
                      )}
                      <button className="text-sm text-red-600 hover:underline" onClick={() => quitar(i.clave)}>Quitar</button>
                      <span className="ml-auto font-semibold">{pesos(i.precio * i.cantidad)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="card h-fit space-y-3">
              <div className="flex justify-between"><span>Subtotal</span><b>{pesos(subtotal)}</b></div>
              <p className="muted text-xs">El envío y los descuentos por forma de pago se calculan en el siguiente paso.</p>
              <Link href="/checkout" className="btn w-full">Finalizar compra</Link>
              <Link href="/tienda" className="btn-ghost w-full">Seguir comprando</Link>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
