"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obtenerStaff } from "@/lib/auth";
import { claveTelefono, type FilaCliente } from "@/lib/csv";

export type ResultadoImportacion = {
  creados: number;
  instrumentos: number;
  omitidos: { fila: number; nombre: string; motivo: string }[];
  error?: string;
};

const MAX_FILAS = 2000;

export async function importarClientes(filas: FilaCliente[], omitirExistentes: boolean): Promise<ResultadoImportacion> {
  const { staff } = await obtenerStaff();
  if (!staff) return { creados: 0, instrumentos: 0, omitidos: [], error: "Sin permiso." };
  if (!Array.isArray(filas) || filas.length === 0) return { creados: 0, instrumentos: 0, omitidos: [], error: "El archivo no tiene clientes." };
  if (filas.length > MAX_FILAS) return { creados: 0, instrumentos: 0, omitidos: [], error: `Máximo ${MAX_FILAS} filas por archivo.` };

  const supabase = await createClient();

  // Clientes que ya existen (por teléfono o email) para no duplicarlos.
  const telExistentes = new Set<string>();
  const mailExistentes = new Set<string>();
  if (omitirExistentes) {
    for (let desde = 0; ; desde += 1000) {
      const { data } = await supabase.from("clientes").select("telefono, email").range(desde, desde + 999);
      (data ?? []).forEach((c) => {
        const t = claveTelefono(c.telefono); if (t) telExistentes.add(t);
        if (c.email) mailExistentes.add(c.email.toLowerCase());
      });
      if (!data || data.length < 1000) break;
    }
  }

  const omitidos: ResultadoImportacion["omitidos"] = [];
  const aCrear: { fila: FilaCliente; n: number }[] = [];
  const vistosTel = new Set<string>();
  const vistosMail = new Set<string>();

  filas.forEach((f, i) => {
    const n = i + 2; // fila 1 = encabezados
    const nombre = String(f.nombre ?? "").trim().slice(0, 200);
    if (!nombre) return omitidos.push({ fila: n, nombre: "—", motivo: "Falta el nombre" });
    const tel = claveTelefono(f.telefono);
    const mail = String(f.email ?? "").trim().toLowerCase();
    if (omitirExistentes && ((tel && telExistentes.has(tel)) || (mail && mailExistentes.has(mail)))) {
      return omitidos.push({ fila: n, nombre, motivo: "Ya existe (mismo teléfono o email)" });
    }
    if ((tel && vistosTel.has(tel)) || (mail && vistosMail.has(mail))) {
      return omitidos.push({ fila: n, nombre, motivo: "Repetido dentro del archivo" });
    }
    if (tel) vistosTel.add(tel);
    if (mail) vistosMail.add(mail);
    aCrear.push({ fila: { ...f, nombre }, n });
  });

  let creados = 0;
  let instrumentos = 0;
  const vacio = (s: string) => (s && s.trim() ? s.trim().slice(0, 500) : null);

  // De a 200 para no mandar pedidos enormes; el orden se respeta para los códigos MM-xxxx.
  for (let i = 0; i < aCrear.length; i += 200) {
    const lote = aCrear.slice(i, i + 200);
    const { data, error } = await supabase
      .from("clientes")
      .insert(lote.map(({ fila }) => ({
        nombre: fila.nombre, telefono: vacio(fila.telefono), email: vacio(fila.email), notas: vacio(fila.notas),
      })))
      .select("id");
    if (error || !data) {
      lote.forEach(({ fila, n }) => omitidos.push({ fila: n, nombre: fila.nombre, motivo: `Error: ${error?.message ?? "desconocido"}` }));
      continue;
    }
    creados += data.length;

    const inst = lote
      .map(({ fila }, j) => ({ fila, id: data[j]?.id }))
      .filter(({ fila, id }) => id && (fila.tipo || fila.marca || fila.modelo || fila.numero_serie))
      .map(({ fila, id }) => ({
        cliente_id: id, tipo: vacio(fila.tipo) ?? "Otro", marca: vacio(fila.marca), modelo: vacio(fila.modelo), numero_serie: vacio(fila.numero_serie),
      }));
    if (inst.length) {
      const { error: e2 } = await supabase.from("instrumentos").insert(inst);
      if (!e2) instrumentos += inst.length;
    }
  }

  revalidatePath("/taller/clientes");
  return { creados, instrumentos, omitidos: omitidos.sort((a, b) => a.fila - b.fila) };
}
