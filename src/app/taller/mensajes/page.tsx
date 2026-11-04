import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { appWhatsApp, formatoFechaHora } from "@/lib/estados";
import { obtenerAjustes } from "@/lib/ajustes";
import { obtenerStaff } from "@/lib/auth";
import { guardarAjustes } from "../ajustes/actions";
import { BotonGuardar } from "@/components/BotonGuardar";

type Fila = { cliente_id: string; texto: string; autor: string; tipo: string; creado_en: string; leido_taller: boolean; clientes: { nombre: string; codigo: string; telefono: string | null } | null };

/** Bandeja: una fila por cliente, primero los que tienen mensajes sin leer. */
export default async function MensajesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("mensajes").select("cliente_id, texto, autor, tipo, creado_en, leido_taller, clientes(nombre, codigo, telefono)")
    .order("creado_en", { ascending: false }).limit(1000);
  const filas = (data ?? []) as unknown as Fila[];
  const porCliente = new Map<string, { ultimo: Fila; sinLeer: number }>();
  for (const m of filas) {
    const e = porCliente.get(m.cliente_id);
    if (!e) porCliente.set(m.cliente_id, { ultimo: m, sinLeer: m.autor === "cliente" && !m.leido_taller ? 1 : 0 });
    else if (m.autor === "cliente" && !m.leido_taller) e.sinLeer++;
  }
  const { staff } = await obtenerStaff();
  const rapidas = (await obtenerAjustes()).respuestas_rapidas ?? "";
  const conversaciones = [...porCliente.entries()].sort((a, b) => (b[1].sinLeer > 0 ? 1 : 0) - (a[1].sinLeer > 0 ? 1 : 0));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Mensajes de clientes</h1>
        <p className="muted text-sm">Lo que te escriben desde su panel: consultas, pedidos de turno y aprobaciones. Para escribirle a alguien nuevo, entrá a su ficha → “Chat”.</p>
      </div>
      <div className="card divide-y !p-0">
        {conversaciones.length === 0 && <p className="muted p-4 text-sm">Todavía no hay mensajes.</p>}
        {conversaciones.map(([id, { ultimo, sinLeer }]) => (
          <div key={id} className="flex flex-wrap items-center gap-3 p-4" style={{ borderColor: "var(--line)" }}>
            <Link href={`/taller/mensajes/${id}`} className="min-w-0 flex-1">
              <p className="flex items-center gap-2">
                <span className={sinLeer ? "font-bold" : "font-medium"}>{ultimo.clientes?.nombre}</span>
                <span className="muted font-mono text-xs">{ultimo.clientes?.codigo}</span>
                {ultimo.tipo === "turno" && <span className="badge bg-sky-100 text-sky-800">Turno</span>}
                {ultimo.tipo === "aprobacion" && <span className="badge bg-amber-100 text-amber-800">Aprobación</span>}
              </p>
              <p className={`truncate text-sm ${sinLeer ? "" : "muted"}`}>{ultimo.autor === "taller" ? "Vos: " : ""}{ultimo.texto}</p>
              <p className="muted text-xs">{formatoFechaHora(ultimo.creado_en)}</p>
            </Link>
            {sinLeer > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold text-white" style={{ background: "var(--accent)" }}>{sinLeer}</span>}
            <a href={appWhatsApp(ultimo.clientes?.telefono, "Hola! ")} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ background: "#25D366" }} aria-label={`WhatsApp de ${ultimo.clientes?.nombre}`}>WhatsApp</a>
            <Link href={`/taller/mensajes/${id}`} className="btn !py-1.5 text-sm">Responder</Link>
          </div>
        ))}
      </div>
      {staff?.rol === "admin" && (
        <details className="card">
          <summary className="cursor-pointer font-semibold">Respuestas rápidas del chat</summary>
          <form action={guardarAjustes} className="mt-3 space-y-2">
            <p className="muted text-xs">Una por línea. Aparecen como botones arriba del cuadro de texto cuando le escribís a un cliente.</p>
            <textarea name="respuestas_rapidas" rows={6} defaultValue={rapidas} className="w-full rounded-xl border p-3 text-sm" style={{ borderColor: "var(--line)", background: "var(--bg)" }} />
            <BotonGuardar />
          </form>
        </details>
      )}
    </div>
  );
}
