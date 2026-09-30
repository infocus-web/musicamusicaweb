export const CATEGORIAS_TIENDA = [
  { id: "cuerdas", label: "Cuerdas" },
  { id: "accesorios", label: "Accesorios" },
  { id: "cables", label: "Cables" },
  { id: "cuidado", label: "Limpieza y cuidado" },
  { id: "repuestos", label: "Repuestos" },
  { id: "pedales", label: "Pedales y efectos" },
  { id: "guitarras", label: "Guitarras" },
  { id: "bajos", label: "Bajos" },
  { id: "amplificadores", label: "Amplificadores" },
  { id: "teclados", label: "Teclados" },
  { id: "percusion", label: "Percusión" },
  { id: "sonido", label: "Sonido" },
  { id: "servicios", label: "Servicios del taller" },
] as const;

export const categoriaTiendaLabel = (id: string) => CATEGORIAS_TIENDA.find((c) => c.id === id)?.label ?? id;

export type Variante = { id: string; producto_id: string; nombre: string; precio: number | null; stock: number; sku: string | null; orden: number };
export type Producto = {
  id: string; slug: string; nombre: string; tipo: "producto" | "servicio"; categoria: string; marca: string | null;
  descripcion: string | null; precio: number; precio_anterior: number | null; stock: number; sin_stock_vende: boolean;
  fotos: string[]; activo: boolean; destacado: boolean; sku: string | null; creado_en: string; actualizado_en: string;
  variantes?: Variante[];
};

export const fotoProducto = (path?: string | null) =>
  path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/productos/${path}` : null;

export const pesos = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

/** Hay stock para vender (servicios y "vender sin stock" siempre sí). */
export function disponible(p: Pick<Producto, "tipo" | "stock" | "sin_stock_vende">, v?: Pick<Variante, "stock"> | null) {
  if (p.tipo === "servicio" || p.sin_stock_vende) return true;
  return (v ? v.stock : p.stock) > 0;
}

export function slugify(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "producto";
}

export const ESTADOS_PEDIDO: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente de pago", color: "bg-amber-100 text-amber-800" },
  a_cotizar: { label: "Cotizando envío", color: "bg-sky-100 text-sky-800" },
  pagado: { label: "Pagado", color: "bg-emerald-100 text-emerald-800" },
  preparando: { label: "Preparando", color: "bg-indigo-100 text-indigo-800" },
  enviado: { label: "Enviado", color: "bg-violet-100 text-violet-800" },
  listo_retirar: { label: "Listo para retirar", color: "bg-emerald-100 text-emerald-800" },
  entregado: { label: "Entregado", color: "bg-zinc-200 text-zinc-700" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export const PAGOS: Record<string, string> = { mercadopago: "Mercado Pago", transferencia: "Transferencia", efectivo: "Efectivo al retirar" };

/** Ítem del carrito (lo guarda el navegador; el servidor vuelve a validar precio y stock). */
export type ItemCarrito = {
  clave: string;               // producto:variante o usado:id
  tipo: "producto" | "usado";
  id: string;
  varianteId?: string | null;
  nombre: string;
  precio: number;
  foto: string | null;
  cantidad: number;
  max?: number | null;
  href: string;
};
