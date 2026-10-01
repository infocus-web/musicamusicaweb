/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { TarjetasPromo } from "@/components/TarjetasPromo";
import { TarjetaUsado } from "@/components/TarjetaUsado";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import { TarjetaCaso } from "@/components/TarjetaCaso";
import { Carrusel } from "@/components/Carrusel";
import { createAdminClient } from "@/lib/supabase/admin";
import { datosNuestrosClientes } from "@/lib/nuestros-clientes";
import { estrellas } from "@/lib/casos";
import { obtenerAjustes, obtenerImagenesSitio } from "@/lib/ajustes";
import { urlSitio } from "@/lib/imagenes-sitio";
import { fotoUsado, type Usado } from "@/lib/usados";
import { fotoProducto, type Producto } from "@/lib/tienda";
import { Asesor } from "./asesor/Asesor";
import { IconoCategoria } from "@/components/IconoCategoria";
import { Videos } from "@/components/Videos";

export const revalidate = 120;

const CATEGORIAS = [
  { href: "/tienda?cat=cuerdas", label: "Cuerdas", cat: "cuerdas" },
  { href: "/tienda?cat=accesorios", label: "Accesorios", cat: "accesorios" },
  { href: "/tienda?cat=repuestos", label: "Repuestos y herrajes", cat: "repuestos" },
  { href: "/tienda?cat=pedales", label: "Pedales y efectos", cat: "pedales" },
  { href: "/usados", label: "Usados revisados", cat: "_usados" },
  { href: "/tienda?cat=servicios", label: "Servicios del taller", cat: "servicios" },
  { href: "/tienda?cat=cuidado", label: "Limpieza y cuidado", cat: "cuidado" },
  { href: "/tienda?cat=cables", label: "Cables", cat: "cables" },
];

function Titulo({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="space-y-2 text-center">
      <h2 className="titulo text-3xl sm:text-4xl">{children}</h2>
      {sub && <p className="muted">{sub}</p>}
    </div>
  );
}

function Etiquetado({ children, tag, rojo = true }: { children: React.ReactNode; tag?: string | null; rojo?: boolean }) {
  return (
    <div className="relative">
      {children}
      {tag && <span className={`pointer-events-none absolute left-0 top-3 z-10 px-2 py-1 text-[11px] font-bold uppercase text-white ${rojo ? "bg-red-600" : "bg-orange-600"}`}>{tag}</span>}
    </div>
  );
}

/** Dibujo por defecto del banner (cuerdas y brillo rojo) mientras no se cargue una foto en Ajustes. */
function ArteBanner() {
  return (
    <div className="relative h-full min-h-[260px] w-full overflow-hidden rounded-lg bg-zinc-900">
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 40%, rgba(217,0,0,.55), transparent 55%), linear-gradient(135deg,#1a1a1a,#050505)" }} />
      <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 800 400" preserveAspectRatio="none" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1="-20" y1={120 + i * 32} x2="820" y2={40 + i * 30} stroke="#d4d4d4" strokeWidth={0.8 + i * 0.35} />
        ))}
        {[160, 260, 360, 460, 560, 660].map((x) => <line key={x} x1={x} y1="0" x2={x - 60} y2="400" stroke="#8a6d3b" strokeWidth="3" opacity=".5" />)}
      </svg>
      <div className="absolute bottom-5 left-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/70">
        <span className="h-2 w-2 rounded-full bg-red-500" /> Taller de luthería
      </div>
    </div>
  );
}

export default async function Home() {
  const db = createAdminClient();
  const [{ data: usadosData }, { data: liqData }, { data: prodData }, nc, a] = await Promise.all([
    db.from("usados").select("*").eq("estado", "publicado").neq("seccion", "liquidacion").order("destacado", { ascending: false }).order("publicado_en", { ascending: false }).limit(10),
    db.from("usados").select("*").eq("estado", "publicado").eq("seccion", "liquidacion").order("publicado_en", { ascending: false }).limit(10),
    db.from("productos").select("*, variantes(*)").eq("activo", true).order("creado_en", { ascending: false }).limit(60),
    datosNuestrosClientes(3),
    obtenerAjustes(),
  ]);
  const imgs = await obtenerImagenesSitio();
  const usados = (usadosData ?? []) as Usado[];
  const liquidacion = (liqData ?? []) as Usado[];
  const productos = (prodData ?? []) as Producto[];
  const novedades = productos.slice(0, 12);

  // Foto de cada categoría: la del producto más nuevo de esa categoría (o del último usado).
  const fotoCat = (cat: string) =>
    urlSitio(imgs[`img_cat_${cat}`]) ?? (cat === "_usados" ? fotoUsado(usados[0]?.fotos[0]) : fotoProducto(productos.find((p) => p.categoria === cat && p.fotos.length)?.fotos[0]));

  const hero = {
    titulo: a.hero_titulo || "Tu instrumento, en manos de luthiers.",
    texto: a.hero_texto || "Calibración, reparación y puesta a punto. Seguís el avance online, con fotos y videos de cada paso.",
    boton: a.hero_boton || "Pedí tu service",
    link: a.hero_link || "/asesor",
    imagen: urlSitio(a.hero_imagen),
    // Si no se cargó un video desde el panel, se usa el que viene con la web.
    video: urlSitio(imgs.hero_video) ?? "/video/portada.mp4",
  };

  const tiles = [
    { href: "/usados", titulo: "Usados revisados", bajada: "Pasan por nuestro banco antes de venderse", img: urlSitio(imgs.img_tile_usados) ?? fotoUsado(usados[0]?.fotos[0]) },
    { href: "/usados?seccion=liquidacion", titulo: "Liquidación", bajada: "Precios rebajados hasta agotar stock", img: urlSitio(imgs.img_tile_liquidacion) ?? fotoUsado(liquidacion[0]?.fotos[0]), rojo: true },
    { href: "/tienda?cat=servicios", titulo: "Servicio del taller", bajada: "Puesta a punto, calibración y reparaciones", img: urlSitio(imgs.img_tile_servicio) ?? fotoProducto(productos.find((p) => p.tipo === "servicio" && p.fotos.length)?.fotos[0]) },
  ];

  return (
    <>
      <SiteHeader />
      <main>
        {/* Banner principal: el logo entero (sin recortes) a la izquierda y el mensaje a la derecha */}
        <section className="relative isolate overflow-hidden bg-black text-white">
          {hero.video && (
            <>
              {/* Video de fondo detrás del logo: en loop, sin sonido, al 50% sobre el negro */}
              <video src={hero.video} poster={imgs.hero_video ? undefined : "/video/portada.jpg"} autoPlay muted loop playsInline preload="auto" aria-hidden
                className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50 motion-reduce:hidden" />
            </>
          )}
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:py-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <div className="flex items-center justify-center">
              {hero.imagen
                ? <img src={hero.imagen} alt="Música Música Web" className={`h-auto max-h-[240px] w-full object-contain sm:max-h-[340px] lg:max-h-[400px] ${hero.video ? "mix-blend-lighten" : ""}`} />
                : <ArteBanner />}
            </div>
            <div className="flex flex-col gap-4 text-center lg:text-left">
              <h1 className="titulo text-4xl leading-[1.05] sm:text-5xl xl:text-6xl">{hero.titulo}</h1>
              <p className="text-lg font-semibold text-amber-400 sm:text-xl">{hero.texto}</p>
              <div className="flex flex-wrap justify-center gap-3 pt-2 lg:justify-start">
                <Link href={hero.link} className="inline-flex items-center rounded bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-red-700">{hero.boton}</Link>
                <Link href="/mi-cuenta" className="inline-flex items-center rounded border border-white/40 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-white/10">Ver mi instrumento</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Tres tarjetas, separadas del banner */}
        <section className="border-t border-white/10 bg-zinc-950 px-4 py-8">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">
            {tiles.map((t) => (
              <Link key={t.href} href={t.href} className="group relative block aspect-[16/9] overflow-hidden rounded-md bg-zinc-800 sm:aspect-[4/3] lg:aspect-[16/9]">
                {t.img ? <img src={t.img} alt="" className="h-full w-full object-cover opacity-70 transition group-hover:scale-105 group-hover:opacity-90" />
                  : <div className="h-full w-full" style={{ background: t.rojo ? "linear-gradient(135deg,#d90000,#5a0000)" : "linear-gradient(135deg,#2b2b2b,#0d0d0d)" }} />}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4 text-white">
                  <p className="titulo text-2xl">{t.titulo}</p>
                  <p className="text-sm text-white/80">{t.bajada}</p>
                  <span className="mt-2 w-fit bg-red-600 px-2 py-0.5 text-xs font-bold uppercase">Ver →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-16 px-4 py-14">
          {/* Categorías */}
          <section className="space-y-8">
            <Titulo>Categorías populares</Titulo>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
              {CATEGORIAS.map((c) => {
                const img = fotoCat(c.cat);
                return (
                  <Link key={c.href} href={c.href} className="group space-y-3 text-center">
                    <div className="mx-auto grid aspect-square w-full max-w-[220px] place-items-center overflow-hidden rounded-full" style={{ background: "var(--soft)" }}>
                      {img ? <img src={img} alt="" className="h-4/5 w-4/5 object-contain transition group-hover:scale-105" />
                        : <IconoCategoria cat={c.cat} />}
                    </div>
                    <p className="titulo text-lg group-hover:underline">{c.label}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Novedades de la tienda */}
          {novedades.length > 0 && (
            <section className="space-y-6">
              <Titulo>Novedades</Titulo>
              <Carrusel>
                {novedades.map((p) => {
                  const off = p.precio_anterior && p.precio_anterior > p.precio ? Math.round((1 - p.precio / p.precio_anterior) * 100) : null;
                  return <Etiquetado key={p.id} tag={off ? `${off}% de descuento` : "Novedad"} rojo={!off}><TarjetaProducto p={p} /></Etiquetado>;
                })}
              </Carrusel>
              <div className="text-center"><Link href="/tienda" className="btn-rojo">Ver toda la tienda</Link></div>
            </section>
          )}

          {/* Asesor */}
          <section id="asesor" className="relative scroll-mt-32 overflow-hidden rounded-2xl bg-zinc-950 p-5 text-white sm:p-10">
            <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(217,0,0,.45), transparent 65%)" }} />
            <div className="relative grid items-start gap-8 lg:grid-cols-[1fr_1.3fr]">
              <div className="space-y-4 lg:pt-6">
                <p className="text-xs font-bold uppercase tracking-widest text-red-400">Asesor del taller</p>
                <h2 className="titulo text-4xl">¿No sabés qué necesitás? Te asesoramos.</h2>
                <p className="text-zinc-300">Contestá 3 o 4 preguntas y te decimos qué instrumento te conviene según tu nivel y presupuesto, o qué service necesita el tuyo. Sin registrarte.</p>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li>✓ Recomendaciones de técnicos, no de un algoritmo de ventas</li>
                  <li>✓ Te mostramos usados revisados que encajan con lo que buscás</li>
                  <li>✓ Seguís la charla por WhatsApp con todo resumido</li>
                </ul>
              </div>
              <div className="text-[var(--fg)]"><Asesor whatsapp={a.whatsapp} /></div>
            </div>
          </section>

          {/* Liquidación */}
          {liquidacion.length > 0 && (
            <section className="space-y-6">
              <Titulo sub="Nuevos y usados con precio rebajado, hasta agotar stock.">Liquidación</Titulo>
              <Carrusel>{liquidacion.map((u) => <TarjetaUsado key={u.id} u={u} />)}</Carrusel>
              <div className="text-center"><Link href="/usados?seccion=liquidacion" className="btn-rojo">Ver liquidación</Link></div>
            </section>
          )}

          {/* Usados */}
          {usados.length > 0 && (
            <section className="space-y-6">
              <Titulo sub="Cada uno pasa por nuestro banco de trabajo antes de publicarse.">Usados revisados</Titulo>
              <Carrusel>{usados.map((u) => <TarjetaUsado key={u.id} u={u} />)}</Carrusel>
              <div className="text-center"><Link href="/usados" className="btn-rojo">Ver todos los usados</Link></div>
            </section>
          )}

          {a.videos_portada && (
            <section className="space-y-6">
              <Titulo sub="Mirá cómo trabajamos en el banco del taller.">Videos del taller</Titulo>
              <Videos links={a.videos_portada.split("\n").filter(Boolean)} columnas={3} />
            </section>
          )}

          <TarjetasPromo />

          {/* Nuestros clientes */}
          {nc.casos.length > 0 && (
            <section className="space-y-6">
              <Titulo sub={nc.promedio ? `${estrellas(Math.round(nc.promedio))} ${nc.promedio.toFixed(1)} · ${nc.resenas.length} opiniones de clientes` : undefined}>Nuestros clientes</Titulo>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {nc.casos.map((c) => <TarjetaCaso key={c.id} c={c} r={nc.resenas.find((r) => r.id === c.resena_id)} />)}
              </div>
              <div className="text-center"><Link href="/nuestros-clientes" className="btn-rojo">Ver más trabajos</Link></div>
            </section>
          )}
        </div>

        {/* Franja de seguimiento */}
        <section style={{ background: "var(--soft)" }}>
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="space-y-1">
              <h2 className="titulo text-2xl">¿Ya dejaste tu instrumento?</h2>
              <p className="muted">Entrá con tu código de cliente o abrí el link que te mandamos por WhatsApp para ver en qué etapa está.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/mi-cuenta" className="btn">Entrar a mi cuenta</Link>
              <Link href="/registro" className="btn-ghost">Registrarme</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
