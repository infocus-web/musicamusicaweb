export const ESTADOS = [
  { id: "recibido", label: "Recibido", color: "bg-slate-100 text-slate-700" },
  { id: "en_revision", label: "En revisión", color: "bg-sky-100 text-sky-800" },
  { id: "esperando_aprobacion", label: "Esperando aprobación", color: "bg-amber-100 text-amber-800" },
  { id: "esperando_repuesto", label: "Esperando repuesto", color: "bg-orange-100 text-orange-800" },
  { id: "en_trabajo", label: "En trabajo", color: "bg-indigo-100 text-indigo-800" },
  { id: "listo", label: "Listo para retirar", color: "bg-emerald-100 text-emerald-800" },
  { id: "entregado", label: "Entregado", color: "bg-zinc-200 text-zinc-700" },
  { id: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700" },
] as const;

export type EstadoId = (typeof ESTADOS)[number]["id"];

export function estadoInfo(id: string) {
  return ESTADOS.find((e) => e.id === id) ?? ESTADOS[0];
}

/** Estados en curso (se muestran en el tablero del taller). */
export const ESTADOS_ACTIVOS: EstadoId[] = [
  "recibido", "en_revision", "esperando_aprobacion", "esperando_repuesto", "en_trabajo", "listo",
];

export const TIPOS_INSTRUMENTO = [
  "Guitarra eléctrica", "Guitarra criolla", "Guitarra acústica", "Bajo", "Violín", "Viola",
  "Violonchelo", "Contrabajo", "Ukelele", "Teclado / Piano", "Batería", "Vientos", "Amplificador", "Otro",
];

export const SERVICIOS = [
  "Puesta a punto", "Calibración", "Reparación", "Mantenimiento", "Cambio de cuerdas",
  "Trastes", "Electrónica", "Restauración", "Otro",
];

export function formatoPesos(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export function formatoFecha(d: string | null | undefined) {
  if (!d) return "—";
  const date = d.length === 10 ? new Date(d + "T12:00:00") : new Date(d);
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatoFechaHora(d: string) {
  return new Date(d).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function linkSeguimiento(token: string) {
  return `${siteUrl()}/seguimiento/${token}`;
}

/** Link de WhatsApp con el mensaje armado. Asume teléfonos de Argentina si no traen código de país. */
export function linkWhatsApp(telefono: string | null | undefined, mensaje: string) {
  let num = (telefono ?? "").replace(/\D/g, "");
  if (num && !num.startsWith("54")) num = "549" + num.replace(/^0/, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`;
}
