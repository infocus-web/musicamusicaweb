export const CATEGORIAS_USADOS = [
  { id: "guitarras", label: "Guitarras" },
  { id: "bajos", label: "Bajos" },
  { id: "amplificadores", label: "Amplificadores" },
  { id: "pedales", label: "Pedales y efectos" },
  { id: "teclados", label: "Teclados y pianos" },
  { id: "bateria", label: "Baterías y percusión" },
  { id: "cuerdas-frotadas", label: "Violines y cuerdas frotadas" },
  { id: "vientos", label: "Vientos" },
  { id: "sonido", label: "Sonido y audio" },
  { id: "otros", label: "Otros" },
] as const;

export const SECCIONES = [
  { id: "usados", label: "Usados", clase: "bg-zinc-900 text-white", icono: "⚡", bajada: "Instrumentos usados revisados en el taller, listos para tocar." },
  { id: "liquidacion", label: "Liquidación", clase: "bg-red-600 text-white", icono: "✺", bajada: "Oportunidades con precio rebajado, nuevos y usados, hasta agotar stock." },
] as const;
export type SeccionId = (typeof SECCIONES)[number]["id"];
export const seccionInfo = (id: string) => SECCIONES.find((s) => s.id === id) ?? SECCIONES[0];

export const CONDICIONES = [
  { id: "nuevo", label: "Nuevo", detalle: "Sin uso, en su caja." },
  { id: "impecable", label: "Impecable", detalle: "Sin marcas de uso visibles." },
  { id: "muy_bueno", label: "Muy bueno", detalle: "Marcas mínimas de uso, funciona perfecto." },
  { id: "bueno", label: "Bueno", detalle: "Marcas de uso normales, funciona perfecto." },
  { id: "con_detalles", label: "Con detalles", detalle: "Tiene detalles estéticos o funcionales, descriptos abajo." },
  { id: "a_reparar", label: "Para reparar", detalle: "Necesita trabajo; ideal para proyecto." },
] as const;

export const ESTADOS_USADO = [
  { id: "borrador", label: "Borrador", color: "bg-zinc-200 text-zinc-700" },
  { id: "publicado", label: "Publicado", color: "bg-emerald-100 text-emerald-800" },
  { id: "reservado", label: "Reservado", color: "bg-amber-100 text-amber-800" },
  { id: "vendido", label: "Vendido", color: "bg-red-100 text-red-700" },
] as const;

export type Usado = {
  id: string; codigo: string; titulo: string; categoria: string; marca: string | null; modelo: string | null;
  anio: number | null; condicion: string; precio: number | null; moneda: "ARS" | "USD"; precio_negociable: boolean;
  descripcion: string | null; caracteristicas: string | null; incluye: string | null; revision: string | null;
  garantia_dias: number | null; acepta_permuta: boolean; envio: boolean; destacado: boolean;
  estado: "borrador" | "publicado" | "reservado" | "vendido"; fotos: string[];
  seccion: SeccionId; precio_anterior: number | null; venta_online: boolean;
  publicado_en: string | null; vendido_en: string | null; creado_en: string; actualizado_en: string;
};

export const categoriaLabel = (id: string) => CATEGORIAS_USADOS.find((c) => c.id === id)?.label ?? id;
export const condicionInfo = (id: string) => CONDICIONES.find((c) => c.id === id) ?? CONDICIONES[1];
export const estadoUsadoInfo = (id: string) => ESTADOS_USADO.find((e) => e.id === id) ?? ESTADOS_USADO[0];

export function formatoPrecio(precio: number | null, moneda: string) {
  if (precio == null) return "Consultar";
  return moneda === "USD"
    ? `US$ ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(precio)}`
    : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(precio);
}

/** URL pública de una foto del bucket "usados". */
export function fotoUsado(path: string | undefined | null) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/usados/${path}`;
}

export const lineas = (t: string | null | undefined) =>
  (t ?? "").split(/\r?\n/).map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);

/** % de descuento si hay precio anterior mayor al actual. */
export function descuento(precio: number | null, anterior: number | null) {
  if (!precio || !anterior || anterior <= precio) return null;
  return Math.round((1 - precio / anterior) * 100);
}
