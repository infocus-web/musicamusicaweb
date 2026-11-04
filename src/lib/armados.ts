/** "Armá tu instrumento": estados y sugerencias de partes (lo usan el panel del cliente y el del taller). */

export const ESTADOS_ARMADO: Record<string, { label: string; clase: string }> = {
  borrador: { label: "Armando", clase: "bg-slate-100 text-slate-700" },
  enviado: { label: "Esperando presupuesto", clase: "bg-amber-100 text-amber-800" },
  presupuestado: { label: "Presupuesto listo", clase: "bg-sky-100 text-sky-800" },
  aprobado: { label: "Aprobado", clase: "bg-emerald-100 text-emerald-800" },
  rechazado: { label: "No aprobado", clase: "bg-rose-100 text-rose-800" },
  cancelado: { label: "Cancelado", clase: "bg-slate-100 text-slate-500" },
};

export const TIPOS_ARMADO = ["Guitarra eléctrica", "Bajo", "Guitarra acústica", "Guitarra criolla", "Ukelele", "Violín", "Pedal / efecto", "Amplificador", "Otro"];

const ELECTRICA = [
  "Cuerpo", "Mástil", "Diapasón", "Trastes", "Cejuela", "Clavijas", "Puente", "Trémolo",
  "Pastilla del mástil", "Pastilla del medio", "Pastilla del puente", "Potenciómetros", "Selector",
  "Capacitor", "Jack de salida", "Golpeador", "Perillas", "Tapa trasera", "Strap locks", "Cuerdas", "Terminación / pintura",
];

const PARTES: Record<string, string[]> = {
  "Guitarra eléctrica": ELECTRICA,
  Bajo: ["Cuerpo", "Mástil", "Diapasón", "Trastes", "Cejuela", "Clavijas", "Puente", "Pastilla del mástil", "Pastilla del puente", "Preamp", "Potenciómetros", "Jack de salida", "Golpeador", "Perillas", "Strap locks", "Cuerdas", "Terminación / pintura"],
  "Guitarra acústica": ["Tapa", "Aros y fondo", "Mástil", "Diapasón", "Trastes", "Cejuela", "Hueso del puente", "Clavijas", "Ecualizador / pastilla", "Cuerdas", "Terminación"],
  "Guitarra criolla": ["Tapa", "Aros y fondo", "Mástil", "Diapasón", "Trastes", "Cejuela", "Hueso del puente", "Clavijero", "Ecualizador / pastilla", "Cuerdas", "Terminación"],
  "Violín": ["Cuerpo", "Mástil", "Diapasón", "Cejuela", "Clavijas", "Puente", "Alma", "Cordal", "Afinadores finos", "Barbada", "Cuerdas"],
  "Pedal / efecto": ["Kit / circuito", "Gabinete", "Footswitch", "Potenciómetros", "Perillas", "Jacks", "LED", "Fuente / conector DC", "Pintura / gráfica"],
  Amplificador: ["Gabinete", "Parlante", "Válvulas", "Transformador", "Chasis / circuito", "Perillas", "Tela / rejilla"],
};

export const partesSugeridas = (tipo: string | null | undefined) => PARTES[tipo ?? ""] ?? ELECTRICA;
