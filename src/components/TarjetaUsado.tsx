/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { condicionInfo, descuento, fotoUsado, formatoPrecio, seccionInfo, type Usado } from "@/lib/usados";

type Props = Pick<Usado, "codigo" | "titulo" | "condicion" | "precio" | "precio_anterior" | "moneda" | "fotos" | "estado" | "acepta_permuta" | "revision" | "garantia_dias" | "seccion">;

export function TarjetaUsado({ u }: { u: Props }) {
  const foto = fotoUsado(u.fotos[0]);
  const vendido = u.estado === "vendido";
  const off = descuento(u.precio, u.precio_anterior);
  const sec = seccionInfo(u.seccion);
  const premium = u.seccion === "premium";
  return (
    <Link
      href={`/usados/${u.codigo}`}
      className="card group flex flex-col overflow-hidden p-0 transition hover:shadow-md"
      style={{ opacity: vendido ? 0.6 : 1, borderColor: premium ? "#d4a017" : undefined }}
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: "var(--line)" }}>
        {foto ? (
          <img src={foto} alt={u.titulo} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full place-items-center muted text-sm">Sin foto</div>
        )}
        {u.seccion !== "usados" && (
          <span className={`absolute right-3 top-3 badge font-bold uppercase ${sec.clase}`}>{sec.icono} {sec.label}</span>
        )}
        {off && <span className="absolute bottom-3 right-3 badge bg-red-600 text-white font-bold">-{off}%</span>}
        {u.estado !== "publicado" && (
          <span className={`absolute left-3 top-3 badge ${vendido ? "bg-red-600 text-white" : "bg-amber-400 text-black"}`}>
            {vendido ? "Vendido" : "Reservado"}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex flex-wrap gap-1 text-[11px]">
          <span className="badge bg-zinc-900 text-white">{u.condicion === "nuevo" ? "Nuevo" : `Usado · ${condicionInfo(u.condicion).label}`}</span>
          {u.revision && <span className="badge" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>Revisado en taller</span>}
        </div>
        <h3 className="font-semibold leading-snug">{u.titulo}</h3>
        <div className="mt-auto pt-2">
          {off && <p className="muted text-sm line-through">{formatoPrecio(u.precio_anterior, u.moneda)}</p>}
          <p className="text-lg font-semibold">{formatoPrecio(u.precio, u.moneda)}</p>
        </div>
        <p className="muted text-xs">
          {[u.garantia_dias ? `Garantía ${u.garantia_dias} días` : null, u.acepta_permuta ? "Acepta permuta" : null].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}
