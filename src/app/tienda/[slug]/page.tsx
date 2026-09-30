import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { categoriaTiendaLabel, disponible, fotoProducto, pesos, type Producto } from "@/lib/tienda";
import { descuento } from "@/lib/usados";
import { obtenerAjustes, waTaller } from "@/lib/ajustes";
import { siteUrl } from "@/lib/estados";
import { SiteHeader } from "@/components/SiteHeader";
import { Galeria } from "@/components/Galeria";
import { AgregarAlCarrito } from "@/components/AgregarAlCarrito";
import { Compartir } from "@/components/Compartir";
import { Videos } from "@/components/Videos";

export const revalidate = 60;

async function buscar(slug: string) {
  const { data } = await createAdminClient().from("productos").select("*, variantes(*)").eq("slug", slug).eq("activo", true).maybeSingle();
  return data as Producto | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await buscar((await params).slug);
  if (!p) return { title: "Producto no encontrado" };
  const f = fotoProducto(p.fotos[0]);
  return { title: `${p.nombre} — Tienda Música Música Web`, description: `${pesos(p.precio)}. ${p.descripcion?.slice(0, 140) ?? ""}`, openGraph: f ? { images: [f] } : undefined };
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await buscar((await params).slug);
  if (!p) notFound();
  const ajustes = await obtenerAjustes();
  const vs = (p.variantes ?? []).sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
  const ilimitado = p.tipo === "servicio" || p.sin_stock_vende;
  const opciones = vs.length
    ? vs.map((v) => ({ varianteId: v.id, nombre: v.nombre, precio: v.precio ?? p.precio, stock: ilimitado ? null : v.stock }))
    : [{ varianteId: null, nombre: p.nombre, precio: p.precio, stock: ilimitado ? null : p.stock }];
  const off = descuento(p.precio, p.precio_anterior);
  const url = `${siteUrl()}/tienda/${p.slug}`;
  const wa = waTaller(ajustes.whatsapp, `Hola! Tengo una consulta sobre ${p.nombre}: ${url}`);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <nav className="muted text-sm"><Link href="/tienda" className="hover:underline">Tienda</Link> / <Link href={`/tienda?cat=${p.categoria}`} className="hover:underline">{categoriaTiendaLabel(p.categoria)}</Link></nav>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <Galeria fotos={p.fotos.map((f) => fotoProducto(f)!)} alt={p.nombre} />
          <section className="space-y-4">
            {p.marca && <p className="muted text-sm uppercase tracking-wide">{p.marca}</p>}
            <h1 className="text-2xl sm:text-3xl font-semibold">{p.nombre}</h1>
            {off && <p className="flex items-center gap-2 text-sm"><span className="muted line-through">{pesos(p.precio_anterior)}</span><span className="badge bg-red-600 text-white font-bold">-{off}%</span></p>}
            <AgregarAlCarrito
              base={{ tipo: "producto", id: p.id, nombre: p.nombre, foto: fotoProducto(p.fotos[0]), href: `/tienda/${p.slug}` }}
              opciones={opciones}
            />
            {!disponible(p) && !vs.length && wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost">Avisame cuando entre</a>}
            <ul className="muted space-y-1 text-sm">
              <li>• Mercado Pago, transferencia o efectivo al retirar</li>
              <li>• Retiro en el local o envío a todo el país</li>
              {p.tipo === "servicio" && <li>• Después de pagar coordinamos el turno por WhatsApp</li>}
            </ul>
            <div className="flex flex-wrap gap-2">
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost">Consultar por WhatsApp</a>}
              <Compartir titulo={p.nombre} url={url} />
            </div>
            {p.sku && <p className="muted text-xs">Código: {p.sku}</p>}
          </section>
        </div>
        {(p.videos ?? []).length > 0 && (
          <section className="space-y-3">
            <h2 className="titulo text-2xl">Videos</h2>
            <Videos links={p.videos} />
          </section>
        )}
        {p.descripcion && (
          <section className="card space-y-2">
            <h2 className="font-semibold">Descripción</h2>
            <p className="whitespace-pre-line text-sm">{p.descripcion}</p>
          </section>
        )}
      </main>
    </>
  );
}
