import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { appWhatsApp, formatoFechaHora } from "@/lib/estados";
import { lineaAviso, mensajeAvisos, type AvisoFila } from "@/lib/avisos";
import { BotonEnviar } from "./BotonEnviar";

type Fila = { id: string; tipo: string; dato: string | null; creado_en: string; cliente_id: string;
  clientes: { nombre: string; codigo: string; telefono: string | null; token: string } | null;
  trabajos: { numero: string; instrumentos: { tipo: string; marca: string | null; modelo: string | null } | null } | null };

/** Avisos pendientes agrupados por cliente: un mensaje de WhatsApp por cliente con todas sus novedades. */
export default async function AvisosPage() {
  const { data } = await (await createClient()).from("avisos")
    .select("id, tipo, dato, creado_en, cliente_id, clientes(nombre, codigo, telefono, token), trabajos(numero, instrumentos(tipo, marca, modelo))")
    .is("enviado_en", null).eq("descartado", false).order("creado_en").limit(500);
  const grupos = new Map<string, { cliente: NonNullable<Fila["clientes"]>; avisos: AvisoFila[] }>();
  for (const f of (data ?? []) as unknown as Fila[]) {
    if (!f.clientes) continue;
    const g = grupos.get(f.cliente_id) ?? { cliente: f.clientes, avisos: [] };
    const i = f.trabajos?.instrumentos;
    g.avisos.push({ id: f.id, tipo: f.tipo, dato: f.dato, creado_en: f.creado_en,
      trabajo: f.trabajos ? { numero: f.trabajos.numero, instrumento: [i?.tipo, i?.marca, i?.modelo].filter(Boolean).join(" ") || "instrumento" } : null });
    grupos.set(f.cliente_id, g);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Avisos para enviar</h1>
        <p className="muted text-sm">Se generan solos cuando cambiás el estado de una orden, subís fotos o videos, pedís una aprobación o confirmás un turno. Tocá <b>Enviar por WhatsApp</b>: se abre el chat del cliente con el mensaje armado y el aviso queda como enviado.</p>
      </div>
      {grupos.size === 0 && <p className="card muted text-sm">✓ No hay avisos pendientes. Estás al día.</p>}
      <div className="grid gap-4 xl:grid-cols-2">
        {[...grupos].map(([id, { cliente, avisos }]) => {
          const msg = mensajeAvisos(cliente.nombre, cliente.token, avisos);
          return (
            <article key={id} className="card space-y-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <Link href={`/taller/clientes/${id}`} className="font-semibold hover:underline">{cliente.nombre}</Link>
                <span className="muted font-mono text-xs">{cliente.codigo}</span>
                <span className="muted ml-auto text-xs">{formatoFechaHora(avisos[avisos.length - 1].creado_en)}</span>
              </div>
              <ul className="space-y-1 text-sm">{avisos.map((a) => <li key={a.id}>{lineaAviso(a).replace(/\*/g, "")}</li>)}</ul>
              <details className="text-xs"><summary className="muted cursor-pointer">Ver el mensaje completo</summary><p className="mt-2 whitespace-pre-line rounded-lg p-3" style={{ background: "var(--soft)" }}>{msg}</p></details>
              {cliente.telefono
                ? <BotonEnviar ids={avisos.map((a) => a.id)} href={appWhatsApp(cliente.telefono, msg)} />
                : <p className="text-sm text-red-600">Este cliente no tiene teléfono cargado. <Link href={`/taller/clientes/${id}`} className="link">Cargalo en su ficha</Link>.</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
