export type MediaCaso = { path: string; tipo: "foto" | "video" };
export type Caso = {
  id: string; trabajo_id: string | null; resena_id: string | null; titulo: string; instrumento: string | null;
  servicio: string | null; descripcion: string | null; media: MediaCaso[]; publicado: boolean; orden: number; creado_en: string; videos: string[];
};
export type Resena = {
  id: string; trabajo_id: string | null; cliente_id: string | null; puntaje: number; comentario: string | null;
  nombre_publico: string | null; autoriza_publicar: boolean; aprobada: boolean; creado_en: string;
};
export const urlCaso = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/casos/${path}`;
export const estrellas = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);
