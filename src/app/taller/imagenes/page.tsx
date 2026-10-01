import Link from "next/link";
import { obtenerAjustes, obtenerImagenesSitio } from "@/lib/ajustes";
import { SLOTS } from "@/lib/imagenes-sitio";
import { SlotImagen } from "./SlotImagen";
import { guardarTextosBanner, guardarVideosPortada } from "./actions";
import { CampoVideos } from "@/components/CampoVideos";
import { BotonGuardar } from "@/components/BotonGuardar";

export const dynamic = "force-dynamic";

export default async function ImagenesPage() {
  const [imgs, a] = await Promise.all([obtenerImagenesSitio(), obtenerAjustes()]);
  const grupos = [...new Set(SLOTS.map((s) => s.grupo))];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold">Imágenes y videos de la web</h1>
          <p className="muted text-sm">Tocá o arrastrá una foto sobre cada recuadro: se achica sola y se publica al instante.</p>
        </div>
        <Link href="/" target="_blank" className="btn-ghost">Ver la web</Link>
      </div>

      <Link href="/taller/usados" className="flex flex-wrap items-center gap-3 rounded-xl border-2 p-4" style={{ borderColor: "var(--accent)", background: "color-mix(in srgb, var(--accent) 6%, white)" }}>
        <div className="flex-1">
          <p className="font-semibold">¿Querés publicar un usado con varias fotos?</p>
          <p className="muted text-sm">Esta página es para las fotos fijas de la portada (una por recuadro). Cada instrumento usado se carga en <b>Usados → + Cargar</b>, y ahí podés subir todas las fotos que quieras de una vez.</p>
        </div>
        <span className="btn">Ir a Usados →</span>
      </Link>

      {grupos.map((g) => (
        <section key={g} className="card space-y-4">
          <h2 className="text-lg font-semibold">{g}</h2>
          <div className={`grid gap-5 ${g === "Portada" ? "" : g === "Categorías populares" ? "grid-cols-2 sm:grid-cols-4" : "sm:grid-cols-3"}`}>
            {SLOTS.filter((s) => s.grupo === g).map((s) => <SlotImagen key={s.id} slot={s} inicial={imgs[s.clave] ?? null} />)}
          </div>
          {g === "Portada" && (
            <form action={guardarTextosBanner} className="grid gap-3 border-t pt-4 sm:grid-cols-2" style={{ borderColor: "var(--line)" }}>
              <label className="field sm:col-span-2"><span>Título del banner</span><input name="hero_titulo" defaultValue={a.hero_titulo ?? ""} placeholder="Tu instrumento, en manos de luthiers." /></label>
              <label className="field sm:col-span-2"><span>Bajada</span><input name="hero_texto" defaultValue={a.hero_texto ?? ""} placeholder="Calibración, reparación y puesta a punto. Seguí el avance online." /></label>
              <label className="field"><span>Texto del botón</span><input name="hero_boton" defaultValue={a.hero_boton ?? ""} placeholder="Pedí tu service" /></label>
              <label className="field"><span>Link del botón</span><input name="hero_link" defaultValue={a.hero_link ?? ""} placeholder="/asesor" /></label>
              <div className="sm:col-span-2"><BotonGuardar>Guardar textos</BotonGuardar></div>
            </form>
          )}
        </section>
      ))}

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Videos del taller (portada)</h2>
        <p className="muted text-sm">Pegá los links de YouTube (también sirven Instagram, TikTok o Vimeo). Aparecen en la portada en la sección “Videos del taller”, en el mismo orden.</p>
        <form action={guardarVideosPortada} className="space-y-3">
          <CampoVideos inicial={(a.videos_portada ?? "").split("\n").filter(Boolean)} />
          <BotonGuardar>Guardar videos</BotonGuardar>
        </form>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Fotos y videos de productos, usados y trabajos</h2>
        <p className="muted text-sm">Esas fotos se cargan dentro de cada uno:</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["/taller/tienda", "Productos de la tienda", "Entrá a un producto → recuadro “Fotos” → + Agregar"],
            ["/taller/usados", "Usados y liquidación", "Entrá a un usado → recuadro “Fotos” → + Agregar fotos"],
            ["/taller/nuestros-clientes", "Nuestros clientes", "Entrá a un trabajo → “Fotos y videos” → + Agregar"],
          ].map(([href, t, d]) => (
            <Link key={href} href={href} className="rounded-xl border p-4 hover:shadow-sm" style={{ borderColor: "var(--line)" }}>
              <p className="font-semibold">{t} →</p>
              <p className="muted text-xs">{d}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
