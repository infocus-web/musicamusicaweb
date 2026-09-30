import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { categoriaLabel, condicionInfo, descuento, fotoUsado, formatoPrecio, lineas, seccionInfo, type Usado } from "@/lib/usados";
import { obtenerAjustes, waTaller } from "@/lib/ajustes";
import { siteUrl } from "@/lib/estados";
import { SiteHeader } from "@/components/SiteHeader";
import { Galeria } from "@/components/Galeria";
import { Compartir } from "@/components/Compartir";
import { AgregarAlCarrito } from "@/components/AgregarAlCarrito";

export const revalidate = 60;

async function buscar(codigo: string) {
  const { data } = await createAdminClient()
    .from("usados").select("*").eq("codigo", codigo.toUpperCase()).in("estado", ["publicado", "reservado", "vendido"]).maybeSingle();
  return data as Usado | null;
}

export async function generateMetadata({ params }: { params: Promise<{ codigo: string }> }): Promise<Metadata> {
  const u = await buscar((await params).codigo);
  if (!u) return { title: "Usado no encontrado" };
  const foto = fotoUsado(u.fotos[0]);
  return {
    title: `${u.titulo} — Usados Música Música Web`,
    description: `${condicionInfo(u.condicion).label} · ${formatoPrecio(u.precio, u.moneda)}. Revisado en nuestro taller.`,
    openGraph: foto ? { images: [foto] } : undefined,
  };
}

export default async function UsadoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const u = await buscar((await params).codigo);
  if (!u) notFound();
  const ajustes = await obtenerAjustes();
  const url = `${siteUrl()}/usados/${u.codigo}`;
  const cond = condicionInfo(u.condicion);
  const disponible = u.estado === "publicado";
  const sec = seccionInfo(u.seccion);
  const off = descuento(u.precio, u.precio_anterior);

  const waConsulta = waTaller(ajustes.whatsapp, `Hola! Me interesa el usado ${u.codigo}: ${u.titulo} (${formatoPrecio(u.precio, u.moneda)}). ¿Sigue disponible? ${url}`);
  const waPrueba = waTaller(ajustes.whatsapp, `Hola! Quisiera coordinar para probar el ${u.titulo} (${u.codigo}) en el taller. ${url}`);

  const ficha = [
    ["Categoría", categoriaLabel(u.categoria)],
    ["Marca", u.marca],
    ["Modelo", u.modelo],
    ["Año", u.anio?.toString()],
    ["Estado", `${cond.label} — ${cond.detalle}`],
    ["Código", u.codigo],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <Link href="/usados" className="muted text-sm hover:underline">← Todos los usados</Link>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <Galeria fotos={u.fotos.map((f) => fotoUsado(f)!)} alt={u.titulo} />

          <section className="space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1 text-xs">
                {u.seccion !== "usados" && <Link href={`/usados?seccion=${u.seccion}`} className={`badge font-bold uppercase ${sec.clase}`}>{sec.icono} {sec.label}</Link>}
                <span className="badge bg-zinc-900 text-white">{u.condicion === "nuevo" ? "Nuevo" : `Usado · ${cond.label}`}</span>
                {u.revision && <span className="badge" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>Revisado en taller</span>}
                {u.estado === "reservado" && <span className="badge bg-amber-400 text-black">Reservado</span>}
                {u.estado === "vendido" && <span className="badge bg-red-600 text-white">Vendido</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold">{u.titulo}</h1>
              {off && (
                <p className="flex items-center gap-2 text-sm">
                  <span className="muted line-through">{formatoPrecio(u.precio_anterior, u.moneda)}</span>
                  <span className="badge bg-red-600 text-white font-bold">-{off}%</span>
                </p>
              )}
              <p className="text-3xl font-semibold">{formatoPrecio(u.precio, u.moneda)}</p>
              {u.precio_negociable && <p className="muted text-sm">Precio conversable.</p>}
            </div>

            <ul className="grid grid-cols-2 gap-2 text-sm">
              {u.garantia_dias ? <li className="card !p-3 border-l-4" style={{ borderLeftColor: "var(--accent)" }}>Garantía {u.garantia_dias} días</li> : null}
              {u.acepta_permuta && <li className="card !p-3 border-l-4" style={{ borderLeftColor: "var(--accent)" }}>Tomamos tu usado</li>}
              {u.envio && <li className="card !p-3 border-l-4" style={{ borderLeftColor: "var(--accent)" }}>Envíos a todo el país</li>}
              <li className="card !p-3 border-l-4" style={{ borderLeftColor: "var(--accent)" }}>Probalo en el taller</li>
            </ul>

            {disponible && u.venta_online && u.moneda === "ARS" && u.precio ? (
              <AgregarAlCarrito
                base={{ tipo: "usado", id: u.id, nombre: u.titulo, foto: fotoUsado(u.fotos[0]), href: `/usados/${u.codigo}` }}
                opciones={[{ varianteId: null, nombre: u.titulo, precio: Number(u.precio), stock: 1 }]}
                mostrarPrecio={false}
              />
            ) : null}
            {disponible ? (
              <div className="flex flex-wrap gap-2">
                {waConsulta ? <a href={waConsulta} target="_blank" rel="noreferrer" className="btn flex-1">Consultar por WhatsApp</a> : <span className="muted text-sm">Contacto próximamente.</span>}
                {waPrueba && <a href={waPrueba} target="_blank" rel="noreferrer" className="btn-ghost flex-1">Coordinar una prueba</a>}
              </div>
            ) : (
              <p className="card !p-3 text-sm">{u.estado === "reservado" ? "Está reservado. Escribinos si querés quedar en lista de espera." : "Este instrumento ya se vendió."} <Link href="/usados" className="link">Ver otros usados</Link></p>
            )}
            <div className="flex flex-wrap gap-2">
              {u.acepta_permuta && disponible && (
                <Link href={`/usados/vender?permuta=${u.codigo}`} className="btn-ghost">Ofrecer mi usado en parte de pago</Link>
              )}
              <Compartir titulo={u.titulo} url={url} />
            </div>

            <dl className="card grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {ficha.map(([k, v]) => (<Fragment key={k}><dt className="muted">{k}</dt><dd>{v}</dd></Fragment>))}
            </dl>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {u.descripcion && (
            <section className="card space-y-2 lg:col-span-3">
              <h2 className="font-semibold">Descripción</h2>
              <p className="whitespace-pre-line text-sm">{u.descripcion}</p>
            </section>
          )}
          {lineas(u.caracteristicas).length > 0 && (
            <section className="card space-y-2">
              <h2 className="font-semibold">Características</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm">{lineas(u.caracteristicas).map((l) => <li key={l}>{l}</li>)}</ul>
            </section>
          )}
          {lineas(u.revision).length > 0 && (
            <section className="card space-y-2 border-t-4" style={{ borderTopColor: "var(--accent)" }}>
              <h2 className="font-semibold">Qué le hicimos en el taller</h2>
              <ul className="space-y-1 text-sm">{lineas(u.revision).map((l) => <li key={l} className="flex gap-2"><span style={{ color: "var(--accent)" }}>✓</span>{l}</li>)}</ul>
            </section>
          )}
          {lineas(u.incluye).length > 0 && (
            <section className="card space-y-2">
              <h2 className="font-semibold">Incluye</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm">{lineas(u.incluye).map((l) => <li key={l}>{l}</li>)}</ul>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
