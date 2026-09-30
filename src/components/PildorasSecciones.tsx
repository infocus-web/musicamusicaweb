import Link from "next/link";
import { SECCIONES } from "@/lib/usados";

/** Botones Usados · Liquidación · Usados Premium. */
export function PildorasSecciones({ activa, href }: { activa?: string; href: (seccion?: string) => string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SECCIONES.map((s) => {
        const on = activa === s.id;
        return (
          <Link
            key={s.id}
            href={on ? href(undefined) : href(s.id)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition ${s.clase}`}
            style={{ opacity: activa && !on ? 0.45 : 1, boxShadow: on ? "0 0 0 3px var(--bg), 0 0 0 5px currentColor" : undefined }}
          >
            <span aria-hidden>{s.icono}</span>{s.label}
          </Link>
        );
      })}
    </div>
  );
}
