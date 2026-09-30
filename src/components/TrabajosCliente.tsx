import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ESTADOS, estadoInfo, formatoFecha, formatoFechaHora, formatoPesos } from "@/lib/estados";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Media } from "@/components/Media";

// Pasos que ve el cliente en la barra de progreso
const PASOS = ["recibido", "en_revision", "en_trabajo", "listo", "entregado"];

function pasoActual(estado: string) {
  if (estado === "esperando_aprobacion" || estado === "esperando_repuesto") return 1;
  const i = PASOS.indexOf(estado);
  return i < 0 ? 0 : i;
}

/**
 * Trabajos y avances de un cliente, tal como los ve él.
 * Se usa en el link privado (/seguimiento/[token]) y en Mi cuenta (/mi-cuenta).
 * Solo servidor: lee con service role, así que quien lo llama ya validó al cliente.
 */
export async function TrabajosCliente({ clienteId }: { clienteId: string }) {
  const db = createAdminClient();
  const { data: trabajos } = await db
    .from("trabajos")
    .select("id, numero, servicio, estado, presupuesto, presupuesto_aprobado, fecha_ingreso, fecha_estimada, fecha_entrega, instrumentos(tipo, marca, modelo)")
    .eq("cliente_id", clienteId)
    .neq("estado", "cancelado")
    .order("fecha_ingreso", { ascending: false });

  const ids = (trabajos ?? []).map((t) => t.id);
  const { data: avances } = ids.length
    ? await db
        .from("avances")
        .select("id, trabajo_id, estado, descripcion, media_path, media_tipo, creado_en")
        .in("trabajo_id", ids)
        .eq("visible_cliente", true)
        .order("creado_en", { ascending: false })
    : { data: [] };

  const paths = (avances ?? []).map((a) => a.media_path).filter(Boolean) as string[];
  const firmadas = paths.length ? (await db.storage.from("avances").createSignedUrls(paths, 60 * 60 * 3)).data ?? [] : [];
  const urlDe = (p: string | null) => firmadas.find((f) => f.path === p)?.signedUrl;

  return (
    <>
      {(trabajos ?? []).length === 0 && <div className="card muted">Todavía no hay trabajos registrados.</div>}

      {(trabajos ?? []).map((t) => {
        const inst = t.instrumentos as unknown as { tipo: string; marca: string | null; modelo: string | null } | null;
        const nombre = inst ? [inst.tipo, inst.marca, inst.modelo].filter(Boolean).join(" · ") : t.servicio;
        const paso = pasoActual(t.estado);
        const lista = (avances ?? []).filter((a) => a.trabajo_id === t.id);
        const aviso =
          t.estado === "esperando_aprobacion" ? "Estamos esperando que apruebes el presupuesto para seguir." :
          t.estado === "esperando_repuesto" ? "Estamos esperando un repuesto para continuar." :
          t.estado === "listo" ? "¡Tu instrumento está listo para retirar!" : null;

        return (
          <section key={t.id} className="card space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{nombre}</h2>
                <p className="muted text-sm">Orden <span className="font-mono">{t.numero}</span> · {t.servicio} · ingresó {formatoFecha(t.fecha_ingreso)}</p>
              </div>
              <EstadoBadge estado={t.estado} />
            </div>

            <ol className="grid grid-cols-5 gap-1" aria-label="Progreso">
              {PASOS.map((p, i) => (
                <li key={p} className="space-y-1">
                  <div className="h-1.5 rounded-full" style={{ background: i <= paso ? "var(--accent)" : "var(--line)" }} />
                  <p className={`text-[11px] leading-tight ${i === paso ? "font-medium" : "muted"}`}>{estadoInfo(p).label}</p>
                </li>
              ))}
            </ol>

            {aviso && <p className="rounded-xl p-3 text-sm" style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>{aviso}</p>}

            <dl className="grid grid-cols-2 gap-2 text-sm">
              {t.presupuesto != null && (<><dt className="muted">Presupuesto</dt><dd>{formatoPesos(t.presupuesto)}{t.presupuesto_aprobado ? " · aprobado" : ""}</dd></>)}
              {t.fecha_estimada && t.estado !== "entregado" && (<><dt className="muted">Fecha estimada</dt><dd>{formatoFecha(t.fecha_estimada)}</dd></>)}
              {t.fecha_entrega && (<><dt className="muted">Entregado</dt><dd>{formatoFecha(t.fecha_entrega)}</dd></>)}
            </dl>

            {lista.length > 0 && (
              <div className="space-y-3 border-t pt-4" style={{ borderColor: "var(--line)" }}>
                <h3 className="font-medium">Avances</h3>
                <ol className="space-y-4">
                  {lista.map((a) => {
                    const mediaUrl = urlDe(a.media_path);
                    return (
                      <li key={a.id} className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="muted">{formatoFechaHora(a.creado_en)}</span>
                          {a.estado && ESTADOS.some((e) => e.id === a.estado) && <EstadoBadge estado={a.estado} />}
                        </div>
                        {a.descripcion && <p className="text-sm">{a.descripcion}</p>}
                        {mediaUrl && <Media url={mediaUrl} tipo={a.media_tipo} />}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </section>
        );
      })}

    </>
  );
}
