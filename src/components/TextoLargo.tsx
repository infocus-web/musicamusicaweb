import { Fragment } from "react";

/** **negrita** dentro de una línea. */
function Linea({ texto }: { texto: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {partes.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") && p.length > 4
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}

type Bloque = { tipo: "titulo"; texto: string } | { tipo: "lista"; items: string[] } | { tipo: "parrafo"; lineas: string[] };

/**
 * Muestra el texto cargado en Ajustes (Quiénes somos, Términos):
 * - "# Título" en su propia línea → título (aunque no tenga línea en blanco antes o después)
 * - "- algo" → lista con viñetas
 * - **texto** → negrita
 * - línea en blanco → nuevo párrafo
 */
export function TextoLargo({ texto }: { texto: string }) {
  const bloques: Bloque[] = [];
  for (const cruda of texto.replace(/\r\n?/g, "\n").split("\n")) {
    const linea = cruda.trim();
    const ultimo = bloques[bloques.length - 1];
    if (!linea || linea === "---") { bloques.push({ tipo: "parrafo", lineas: [] }); continue; }
    const titulo = linea.match(/^#{1,3}\s+(.*)$/);
    if (titulo) { bloques.push({ tipo: "titulo", texto: titulo[1].replace(/\*\*/g, "") }); continue; }
    const item = linea.match(/^[-•*]\s+(.*)$/);
    if (item) {
      if (ultimo?.tipo === "lista") ultimo.items.push(item[1]);
      else bloques.push({ tipo: "lista", items: [item[1]] });
      continue;
    }
    if (ultimo?.tipo === "parrafo") ultimo.lineas.push(linea);
    else bloques.push({ tipo: "parrafo", lineas: [linea] });
  }

  return (
    <div className="space-y-3 leading-relaxed">
      {bloques.map((b, i) => {
        if (b.tipo === "titulo") return <h2 key={i} className="pt-3 text-xl font-semibold">{b.texto}</h2>;
        if (b.tipo === "lista") return (
          <ul key={i} className="list-disc space-y-1.5 pl-5">
            {b.items.map((t, j) => <li key={j}><Linea texto={t} /></li>)}
          </ul>
        );
        if (!b.lineas.length) return null;
        return (
          <p key={i}>
            {b.lineas.map((l, j) => <Fragment key={j}>{j > 0 && <br />}<Linea texto={l} /></Fragment>)}
          </p>
        );
      })}
    </div>
  );
}
