/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { descuento } from "@/lib/usados";
import { disponible, fotoProducto, pesos, type Producto } from "@/lib/tienda";

export function TarjetaProducto({ p }: { p: Producto }) {
  const foto = fotoProducto(p.fotos[0]);
  const vs = p.variantes ?? [];
  const hay = vs.length ? vs.some((v) => disponible(p, v)) : disponible(p);
  const precios = vs.map((v) => v.precio ?? p.precio);
  const desde = precios.length ? Math.min(...precios) : p.precio;
  const varios = precios.length > 1 && new Set(precios).size > 1;
  const off = descuento(p.precio, p.precio_anterior);
  return (
    <Link href={`/tienda/${p.slug}`} className="card group flex flex-col overflow-hidden p-0 hover:shadow-md" style={{ opacity: hay ? 1 : 0.6 }}>
      <div className="relative aspect-square overflow-hidden bg-white">
        {foto ? <img src={foto} alt={p.nombre} loading="lazy" className="h-full w-full object-contain transition group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center muted text-sm">Sin foto</div>}
        {off && <span className="absolute right-2 top-2 badge bg-red-600 text-white font-bold">-{off}%</span>}
        {!hay && <span className="absolute left-2 top-2 badge bg-zinc-900 text-white">Sin stock</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {p.marca && <p className="muted text-xs uppercase tracking-wide">{p.marca}</p>}
        <h3 className="text-sm font-medium leading-snug">{p.nombre}</h3>
        <div className="mt-auto pt-2">
          {off && <p className="muted text-xs line-through">{pesos(p.precio_anterior)}</p>}
          <p className="font-semibold">{varios ? "Desde " : ""}{pesos(desde)}</p>
        </div>
      </div>
    </Link>
  );
}
