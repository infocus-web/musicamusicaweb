"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { claveTelefono } from "@/lib/csv";

const MAX_FOTOS = 6;

/** Paso 1: links firmados para que el navegador suba las fotos directo al bucket privado. */
export async function prepararFotos(cantidad: number) {
  const n = Math.max(0, Math.min(MAX_FOTOS, Math.floor(Number(cantidad) || 0)));
  const carpeta = crypto.randomUUID();
  const db = createAdminClient();
  const subidas: { path: string; token: string }[] = [];
  for (let i = 0; i < n; i++) {
    const path = `${carpeta}/${i + 1}.jpg`;
    const { data, error } = await db.storage.from("tasaciones").createSignedUploadUrl(path);
    if (error || !data) return { error: "No se pudieron preparar las fotos." };
    subidas.push({ path, token: data.token });
  }
  return { carpeta, subidas };
}

export type EstadoTasacion = undefined | { error: string } | { ok: true; nombre: string };

const txt = (fd: FormData, k: string, max = 200) => {
  const s = String(fd.get(k) ?? "").trim().slice(0, max);
  return s === "" ? null : s;
};

/** Paso 2: guarda el pedido de tasación con las fotos ya subidas. */
export async function enviarTasacion(fd: FormData): Promise<EstadoTasacion> {
  if (txt(fd, "sitio_web")) return { error: "No se pudo enviar." };
  const t = Number(fd.get("t"));
  if (!t || Date.now() - t < 3000) return { error: "Revisá los datos y volvé a enviar." };

  const nombre = txt(fd, "nombre", 120);
  const telefono = txt(fd, "telefono", 40);
  if (!nombre || nombre.length < 3) return { error: "Escribí tu nombre." };
  if (!claveTelefono(telefono)) return { error: "Escribí un teléfono válido, con código de área." };
  const tipo = fd.get("tipo") === "presupuesto" ? "presupuesto" : "usado";
  const marca = txt(fd, "marca", 80);
  const modelo = txt(fd, "modelo", 80);
  if (!marca && !modelo) return { error: tipo === "presupuesto" ? "Contanos qué producto o servicio te presupuestaron." : "Contanos al menos la marca o el modelo." };

  const quiere = ["vender", "permutar", "consignar"].includes(String(fd.get("quiere"))) ? String(fd.get("quiere")) : "vender";
  const anio = Number(fd.get("anio"));

  // Solo aceptamos fotos de la carpeta que preparamos en el paso 1.
  const carpeta = txt(fd, "carpeta", 40);
  const fotos = fd.getAll("fotos").map(String)
    .filter((p) => carpeta && /^[0-9a-f-]{36}\/\d+\.jpg$/.test(p) && p.startsWith(carpeta + "/"))
    .slice(0, MAX_FOTOS);

  const { error } = await createAdminClient().from("tasaciones").insert({
    tipo,
    nombre, telefono, email: txt(fd, "email", 160),
    categoria: txt(fd, "categoria", 40), marca, modelo,
    anio: anio > 1900 && anio < 2100 ? anio : null,
    condicion: txt(fd, "condicion", 40),
    descripcion: txt(fd, "descripcion", 2000),
    quiere, interes: txt(fd, "interes", 300), precio_pretendido: txt(fd, "precio_pretendido", 60),
    fotos,
  });
  if (error) return { error: "No pudimos guardar tu pedido. Probá de nuevo en un rato." };
  return { ok: true, nombre: nombre.split(" ")[0] };
}
