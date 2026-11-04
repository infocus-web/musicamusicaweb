export const MEDIOS_PAGO = [
  { id: "efectivo", label: "Efectivo" },
  { id: "transferencia", label: "Transferencia" },
  { id: "mercadopago", label: "Mercado Pago" },
  { id: "tarjeta", label: "Tarjeta" },
  { id: "otro", label: "Otro" },
] as const;
export const medioLabel = (id: string | null | undefined) => MEDIOS_PAGO.find((m) => m.id === id)?.label ?? id ?? "—";

/** "2026-11" → primer y último día del mes (fechas YYYY-MM-DD) y etiqueta. */
export function rangoMes(mes?: string | null) {
  const hoy = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const [y, m] = mes && /^\d{4}-\d{2}$/.test(mes) ? mes.split("-").map(Number) : [hoy.getFullYear(), hoy.getMonth() + 1];
  const desde = `${y}-${String(m).padStart(2, "0")}-01`;
  const fin = new Date(y, m, 0).getDate();
  const hasta = `${y}-${String(m).padStart(2, "0")}-${String(fin).padStart(2, "0")}`;
  const etiqueta = new Date(y, m - 1, 15).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const ant = new Date(y, m - 2, 1), sig = new Date(y, m, 1);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return { desde, hasta, etiqueta, mes: `${y}-${String(m).padStart(2, "0")}`, anterior: fmt(ant), siguiente: fmt(sig) };
}

/** Fecha/hora de fin de día en Argentina, para filtrar timestamps. */
export const finDia = (d: string) => `${d}T23:59:59-03:00`;
export const inicioDia = (d: string) => `${d}T00:00:00-03:00`;

export const numeroComprobante = (n: number | string) => String(n).padStart(8, "0");
