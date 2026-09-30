/** Lector de CSV sin dependencias: detecta separador (; , o tab), comillas y BOM. */

export function leerTexto(buf: ArrayBuffer): string {
  // Excel en Windows suele guardar en ANSI (windows-1252); si no es UTF-8 válido, usamos ese.
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

function detectarSeparador(primeraLinea: string) {
  const cuenta = (c: string) => primeraLinea.split(c).length - 1;
  const opciones = [";", ",", "\t"].map((c) => [c, cuenta(c)] as const).sort((a, b) => b[1] - a[1]);
  return opciones[0][1] > 0 ? opciones[0][0] : ",";
}

export function parsearCSV(texto: string): string[][] {
  const sep = detectarSeparador(texto.split(/\r?\n/, 1)[0] ?? "");
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (comillas) {
      if (ch === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } else comillas = false;
      } else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === sep) { fila.push(campo); campo = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && texto[i + 1] === "\n") i++;
      fila.push(campo); filas.push(fila); fila = []; campo = "";
    } else campo += ch;
  }
  if (campo !== "" || fila.length) { fila.push(campo); filas.push(fila); }
  return filas.filter((f) => f.some((c) => c.trim() !== ""));
}

const SINONIMOS: Record<string, string[]> = {
  nombre: ["nombre", "cliente", "nombre y apellido", "apellido y nombre", "nombre completo", "razon social", "name", "display name", "full name"],
  telefono: ["telefono", "tel", "celular", "cel", "whatsapp", "movil", "telefono celular", "phone 1 - value", "mobile phone", "phone", "primary phone", "telefono movil"],
  email: ["email", "e-mail", "mail", "correo", "correo electronico", "e-mail 1 - value", "email address", "e-mail address"],
  notas: ["notas", "nota", "observaciones", "obs", "comentarios", "notes"],
  tipo: ["instrumento", "tipo", "tipo de instrumento"],
  marca: ["marca"],
  modelo: ["modelo"],
  numero_serie: ["numero de serie", "nro de serie", "n de serie", "serie", "n serie", "numero serie", "serial"],
};

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[°º#.]/g, "").replace(/\s+/g, " ").trim();
}

export type FilaCliente = {
  nombre: string; telefono: string; email: string; notas: string;
  tipo: string; marca: string; modelo: string; numero_serie: string;
};

export const CAMPOS = Object.keys(SINONIMOS) as (keyof FilaCliente)[];

/** Convierte las filas del CSV en clientes, reconociendo los encabezados por nombre. */
export function mapearClientes(filas: string[][]): { clientes: FilaCliente[]; columnas: Partial<Record<keyof FilaCliente, string>>; ignoradas: string[] } {
  const [encabezado = [], ...datos] = filas;
  const indice: Partial<Record<keyof FilaCliente, number>> = {};
  const columnas: Partial<Record<keyof FilaCliente, string>> = {};
  const ignoradas: string[] = [];
  encabezado.forEach((h, i) => {
    const n = normalizar(h);
    const campo = CAMPOS.find((c) => SINONIMOS[c].includes(n));
    if (campo && indice[campo] === undefined) { indice[campo] = i; columnas[campo] = h.trim(); }
    else if (h.trim()) ignoradas.push(h.trim());
  });
  // Contactos de Google / Outlook: nombre y apellido vienen en columnas separadas.
  const pos = (...nombres: string[]) => encabezado.findIndex((h) => nombres.includes(normalizar(h)));
  const iNombre = pos("first name", "given name", "nombre de pila");
  const iSegundo = pos("middle name", "additional name");
  const iApellido = pos("last name", "family name", "apellido");
  if (indice.nombre === undefined && (iNombre >= 0 || iApellido >= 0)) columnas.nombre = "nombre + apellido";

  // "+54 9 11 1234-5678 ::: +54 11 ..." → nos quedamos con el primero.
  const primero = (t: string) => t.split(/\s*:::\s*/)[0].trim();

  const clientes = datos.map((f) => {
    const v = (c: keyof FilaCliente) => (indice[c] !== undefined ? (f[indice[c]!] ?? "").trim() : "");
    const partes = [iNombre, iSegundo, iApellido].map((i) => (i >= 0 ? (f[i] ?? "").trim() : "")).filter(Boolean);
    return {
      nombre: v("nombre") || partes.join(" "), telefono: primero(v("telefono")), email: primero(v("email")).toLowerCase(), notas: v("notas"),
      tipo: v("tipo"), marca: v("marca"), modelo: v("modelo"), numero_serie: v("numero_serie"),
    };
  });
  return { clientes, columnas, ignoradas };
}

/** Últimos 10 dígitos: sirve para comparar teléfonos escritos de distintas formas. */
export function claveTelefono(t: string | null | undefined) {
  const d = (t ?? "").replace(/\D/g, "");
  return d.length >= 8 ? d.slice(-10) : "";
}
