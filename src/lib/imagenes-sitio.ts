/** Lugares de la web donde el administrador puede poner una foto (se guardan en la tabla "ajustes"). */
export type Slot = { id: string; clave: string; grupo: string; titulo: string; ayuda: string; ratio: string; tipo?: "foto" | "video" };

const CATS: [string, string][] = [
  ["cuerdas", "Cuerdas"], ["accesorios", "Accesorios"], ["repuestos", "Repuestos y herrajes"], ["pedales", "Pedales y efectos"],
  ["_usados", "Usados revisados"], ["servicios", "Servicios del taller"], ["cuidado", "Limpieza y cuidado"], ["cables", "Cables"],
];

export const SLOTS: Slot[] = [
  { id: "hero", clave: "hero_imagen", grupo: "Portada", titulo: "Banner principal", ayuda: "Foto horizontal (ideal 2000 × 900): el taller, tu banco de trabajo, un instrumento.", ratio: "21/9" },
  { id: "hero_video", clave: "hero_video", grupo: "Portada", titulo: "Video de fondo del banner (opcional)", ayuda: "Video corto en MP4 (10 a 30 segundos, máx. 45 MB). Se reproduce en loop, sin sonido, detrás del logo y el texto. Ideal: el taller trabajando, cámara quieta.", ratio: "21/9", tipo: "video" },
  { id: "tile_usados", clave: "img_tile_usados", grupo: "Tarjetas debajo del banner", titulo: "Usados revisados", ayuda: "Una sola foto de portada para esta tarjeta. Las fotos de cada usado a la venta se cargan en Usados.", ratio: "16/9" },
  { id: "tile_liquidacion", clave: "img_tile_liquidacion", grupo: "Tarjetas debajo del banner", titulo: "Liquidación", ayuda: "Horizontal. Si no cargás nada, se usa la del último en liquidación.", ratio: "16/9" },
  { id: "tile_servicio", clave: "img_tile_servicio", grupo: "Tarjetas debajo del banner", titulo: "Servicio del taller", ayuda: "Horizontal: el taller trabajando.", ratio: "16/9" },
  ...CATS.map(([id, t]) => ({ id: `cat_${id}`, clave: `img_cat_${id}`, grupo: "Categorías populares", titulo: t, ayuda: "Cuadrada, producto sobre fondo blanco.", ratio: "1/1" })),
];

export const urlSitio = (path?: string | null) =>
  path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sitio/${path}` : null;
