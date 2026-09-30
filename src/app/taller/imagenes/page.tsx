import Link from "next/link";
import { obtenerAjustes, obtenerImagenesSitio } from "@/lib/ajustes";
import { SLOTS } from "@/lib/imagenes-sitio";
import { SlotImagen } from "./SlotImagen";
import { guardarTextosBanner } from "./actions";

export const dynamic = "force-dynamic";

export default async function ImagenesPage() {
  const [imgs, a] = await Promise.all([obtenerImagenesSitio(), obtenerAjustes()]);
  const grupos = [...new Set(SLOTS.map((s) => s.grupo))];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold">Imágenes de la web</h1>
          <p className="muted text-sm">Tocá o arrastrá una foto sobre cada recuadro: se achica sola y se publica al instante.</p>
        </div>
        <Link href="/" target="_blank" className="btn-ghost">Ver la web</Link>
      </div>

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
              <div className="sm:col-span-2"><button className="btn">Guardar textos</button></div>
            </form>
          )}
        </section>
      ))}

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Fotos de productos, usados y trabajos</h2>
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
