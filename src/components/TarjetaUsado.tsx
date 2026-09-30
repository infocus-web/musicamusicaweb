/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { condicionInfo, descuento, fotoUsado, formatoPrecio, seccionInfo, type Usado } from "@/lib/usados";
import { Favorito } from "@/components/Favorito";

type Props = Pick<Usado, "id" | "codigo" | "titulo" | "condicion" | "precio" | "precio_anterior" | "moneda" | "fotos" | "estado" | "acepta_permuta" | "revision" | "garantia_dias" | "seccion">;

/** Tarjeta de usado estilo catálogo: foto sobre blanco, título, precio y condición. */
export function TarjetaUsado({ u }: { u: Props }) {
  const foto = fotoUsado(u.fotos[0]);
  const vendido = u.estado === "vendido";
  const off = descuento(u.precio, u.precio_anterior);
  const sec = seccionInfo(u.seccion);
  const etiqueta = vendido ? "Vendido" : u.estado === "reservado" ? "Reservado" : u.seccion !== "usados" ? sec.label : null;
  return (
    <Link href={`/usados/${u.codigo}`} className="group flex h-full flex-col rounded-lg border bg-white p-3 transition hover:shadow-lg"
      style={{ borderColor: "var(--line)", opacity: vendido ? 0.6 : 1 }}>
      <div className="relative">
        <div className="aspect-square overflow-hidden rounded bg-white">
          {foto ? <img src={foto} alt={u.titulo} loading="lazy" className="h-full w-full object-contain transition duration-300 group-hover:scale-105" />
            : <div className="grid h-full place-items-center rounded muted text-sm" style={{ background: "var(--soft)" }}>Sin foto</div>}
        </div>
        {etiqueta && (
          <span className={`absolute left-0 top-0 px-2 py-0.5 text-[11px] font-bold uppercase ${vendido ? "bg-zinc-800 text-white" : u.estado === "reservado" ? "bg-amber-400 text-black" : sec.clase}`}>{etiqueta}</span>
        )}
        <span className="absolute right-0 top-0"><Favorito id={`u:${u.codigo}`} /></span>
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <h3 className="line-clamp-3 text-[15px] leading-snug">{u.condicion === "nuevo" ? "" : "Usado "}{u.titulo}</h3>
        <p className="pt-1 text-lg font-bold">
          {formatoPrecio(u.precio, u.moneda)}
          {off && <span className="ml-2 text-sm font-normal text-red-600 line-through">{formatoPrecio(u.precio_anterior, u.moneda)}</span>}
        </p>
        {u.acepta_permuta && !vendido && <p className="text-xs font-semibold">Tomamos tu usado en parte de pago</p>}
        {u.revision && (
          <p className="flex items-center gap-1 text-xs text-emerald-700">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" /></svg>
            Revisado en el taller{u.garantia_dias ? ` · garantía ${u.garantia_dias} días` : ""}
          </p>
        )}
        <p className="muted mt-auto pt-1 text-xs">Condición: {condicionInfo(u.condicion).label}</p>
      </div>
    </Link>
  );
}
