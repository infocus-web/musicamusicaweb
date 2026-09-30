/** Muestra texto cargado en Ajustes respetando párrafos; líneas que empiezan con "# " se muestran como títulos. */
export function TextoLargo({ texto }: { texto: string }) {
  return (
    <div className="space-y-3 leading-relaxed">
      {texto.split(/\n{2,}/).map((b, i) =>
        b.startsWith("# ") ? <h2 key={i} className="pt-2 text-xl font-semibold">{b.slice(2)}</h2> : <p key={i} className="whitespace-pre-line">{b}</p>,
      )}
    </div>
  );
}
