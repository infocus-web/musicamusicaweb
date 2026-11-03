/**
 * Arma los filtros para buscar en Supabase con `.or()`.
 * - Separa por palabras: tienen que aparecer todas (en cualquier campo y en cualquier orden).
 * - Plural y singular: a cada palabra le saca la "s" / "es" final, así "cuerdas" encuentra
 *   "Cuerda" y "pedales" encuentra "Pedal" (y al revés ya funcionaba).
 *
 * Uso: for (const f of filtrosBusqueda(q, ["nombre", "marca"])) query = query.or(f);
 */
export function filtrosBusqueda(q: string, campos: string[]): string[] {
  const palabras = q
    .toLowerCase()
    .replace(/[%,()*_\\]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
  return palabras.map((p) => {
    const raiz = p.length > 4 ? p.replace(/(es|s)$/, "") : p;
    return campos.map((c) => `${c}.ilike.%${raiz}%`).join(",");
  });
}
