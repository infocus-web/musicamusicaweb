/* eslint-disable @next/next/no-img-element */
import { estrellas, urlCaso, type Caso, type Resena } from "@/lib/casos";
import { Videos } from "@/components/Videos";

export function TarjetaCaso({ c, r }: { c: Caso; r?: Resena | null }) {
  const fotos = c.media.filter((m) => m.tipo === "foto");
  const video = c.media.find((m) => m.tipo === "video");
  const antes = fotos[0];
  const despues = fotos.length > 1 ? fotos[fotos.length - 1] : null;
  return (
    <article className="card flex flex-col gap-3 overflow-hidden p-0">
      {antes && despues ? (
        <div className="grid grid-cols-2 gap-px" style={{ background: "var(--line)" }}>
          {[["Antes", antes], ["Después", despues]].map(([l, m]) => (
            <figure key={l as string} className="relative">
              <img src={urlCaso((m as { path: string }).path)} alt={`${c.titulo} — ${l}`} loading="lazy" className="aspect-square w-full object-cover" />
              <figcaption className="absolute left-2 top-2 badge bg-black/70 text-white">{l as string}</figcaption>
            </figure>
          ))}
        </div>
      ) : antes ? (
        <img src={urlCaso(antes.path)} alt={c.titulo} loading="lazy" className="aspect-[4/3] w-full object-cover" />
      ) : video ? (
        <video src={urlCaso(video.path)} controls playsInline preload="metadata" className="aspect-[4/3] w-full bg-black" />
      ) : null}
      <div className="space-y-2 px-4 pb-4">
        <div className="flex flex-wrap gap-1 text-[11px]">
          {c.servicio && <span className="badge" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>{c.servicio}</span>}
          {c.instrumento && <span className="badge bg-zinc-900 text-white">{c.instrumento}</span>}
        </div>
        <h3 className="font-semibold">{c.titulo}</h3>
        {c.descripcion && <p className="muted whitespace-pre-line text-sm">{c.descripcion}</p>}
        {(c.videos ?? []).length > 0 && <Videos links={c.videos} columnas={1} />}
        {video && antes && (
          <details className="text-sm"><summary className="link cursor-pointer">Ver video</summary>
            <video src={urlCaso(video.path)} controls playsInline preload="none" className="mt-2 w-full rounded-lg bg-black" />
          </details>
        )}
        {r && (
          <blockquote className="rounded-xl p-3 text-sm" style={{ background: "color-mix(in srgb, var(--fg) 5%, transparent)" }}>
            <p style={{ color: "#f5b301" }} aria-label={`${r.puntaje} de 5`}>{estrellas(r.puntaje)}</p>
            {r.comentario && <p className="mt-1">“{r.comentario}”</p>}
            <footer className="muted mt-1 text-xs">— {r.nombre_publico}, cliente del taller</footer>
          </blockquote>
        )}
      </div>
    </article>
  );
}
