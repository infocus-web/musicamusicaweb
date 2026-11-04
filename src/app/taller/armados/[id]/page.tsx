import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { appWhatsApp, formatoFechaHora, formatoPesos, linkSeguimiento } from "@/lib/estados";
import { ESTADOS_ARMADO } from "@/lib/armados";
import { guardarPresupuestoArmado } from "../actions";

type Parte = { id: string; parte: string; nombre: string; modelo: string | null; link: string | null; notas: string | null; precio: number | null; orden: number };

export default async function ArmadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: a } = await supabase.from("armados")
    .select("*, clientes(id, nombre, codigo, telefono, token), armado_partes(id, parte, nombre, modelo, link, notas, precio, orden)")
    .eq("id", id).maybeSingle();
  if (!a) notFound();
  const c = a.clientes as unknown as { id: string; nombre: string; codigo: string; telefono: string | null; token: string } | null;
  const partes = [...((a.armado_partes ?? []) as Parte[])].sort((x, y) => x.orden - y.orden);
  const suma = partes.reduce((s, p) => s + (p.precio != null ? Number(p.precio) : 0), 0);
  const e = ESTADOS_ARMADO[a.estado] ?? ESTADOS_ARMADO.borrador;
  const presupuestable = a.estado === "enviado" || a.estado === "presupuestado";
  const aviso = c ? `Hola ${c.nombre.split(" ")[0]}! Ya tenés el presupuesto de tu armado "${a.nombre}" en tu panel: ${linkSeguimiento(c.token)}?tab=armar` : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="mr-auto">
          <Link href="/taller/armados" className="muted text-sm hover:underline">← Armá tu instrumento</Link>
          <h1 className="text-2xl font-semibold">{a.nombre} <span className={`badge align-middle ${e.clase}`}>{e.label}</span></h1>
          <p className="muted text-sm">
            {a.tipo ?? "Instrumento"} · {c ? <Link className="link" href={`/taller/clientes/${c.id}`}>{c.nombre} ({c.codigo})</Link> : "—"}
            {a.enviado_en ? ` · pidió presupuesto el ${formatoFechaHora(a.enviado_en)}` : ""}
          </p>
        </div>
        {c && <Link href={`/taller/mensajes/${c.id}`} className="btn-ghost">Chat con el cliente</Link>}
        {c?.telefono && <a href={appWhatsApp(c.telefono, `Hola ${c.nombre.split(" ")[0]}! `)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: "#25D366" }}>WhatsApp</a>}
      </div>

      {a.notas && <div className="card text-sm"><p className="muted mb-1 text-xs font-semibold uppercase">Comentarios del cliente</p><p className="whitespace-pre-line">{a.notas}</p></div>}
      {a.estado === "borrador" && <p className="card text-sm" style={{ background: "var(--soft)" }}>El cliente todavía lo está armando (o cambió algo después del presupuesto). Cuando pida presupuesto vas a poder cargar los valores.</p>}
      {(a.estado === "aprobado" || a.estado === "rechazado") && (
        <p className="card text-sm" style={{ background: "var(--soft)" }}>
          {a.estado === "aprobado" ? "✅ El cliente aprobó" : "❌ El cliente no aprobó"} el presupuesto de {formatoPesos(a.presupuesto == null ? null : Number(a.presupuesto))}
          {a.respondido_en ? ` (${formatoFechaHora(a.respondido_en)})` : ""}.{a.respuesta ? <><br />Comentario: “{a.respuesta}”</> : null}
        </p>
      )}

      <form action={guardarPresupuestoArmado.bind(null, a.id)} className="space-y-4">
        <div className="card overflow-x-auto !p-0">
          <table className="w-full text-sm">
            <thead className="muted text-left"><tr><th className="p-3">Parte</th><th className="p-3">Producto</th><th className="p-3 w-40">Valor ($)</th></tr></thead>
            <tbody>
              {partes.length === 0 && <tr><td colSpan={3} className="muted p-3">Sin partes cargadas.</td></tr>}
              {partes.map((p) => (
                <tr key={p.id} className="border-t align-top" style={{ borderColor: "var(--line)" }}>
                  <td className="p-3 font-medium">{p.parte}</td>
                  <td className="p-3">
                    {[p.nombre, p.modelo].filter(Boolean).join(" · ")}
                    {p.notas && <div className="muted whitespace-pre-line text-xs">{p.notas}</div>}
                    {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer nofollow" className="link block max-w-xs truncate text-xs">{p.link}</a>}
                  </td>
                  <td className="p-3">
                    {presupuestable
                      ? <input name={`precio_${p.id}`} inputMode="decimal" defaultValue={p.precio ?? ""} aria-label={`Valor de ${p.parte}`} placeholder="Opcional"
                          className="w-full rounded-lg border px-2 py-1.5" style={{ borderColor: "var(--line)", background: "var(--bg)", color: "var(--fg)" }} />
                      : formatoPesos(p.precio == null ? null : Number(p.precio))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {presupuestable && (
          <div className="card space-y-3">
            <h2 className="font-semibold">Presupuesto para el cliente</h2>
            <p className="muted text-xs">Los valores por parte son opcionales (el cliente los ve al lado de cada parte). El total es lo que tiene que aprobar: incluí mano de obra, armado y terminación.{suma > 0 ? ` Suma de las partes: ${formatoPesos(suma)}.` : ""}</p>
            <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
              <label className="field"><span>Total ($)</span><input name="presupuesto" inputMode="decimal" required defaultValue={a.presupuesto ?? (suma || "")} /></label>
              <label className="field"><span>Detalle para el cliente (opcional)</span><textarea name="detalle" rows={3} defaultValue={a.detalle_presupuesto ?? ""} placeholder="Incluye mano de obra y armado. Plazo estimado: 20 días. Seña del 50% para comprar las partes." /></label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button name="enviar" value="1" className="btn">{a.estado === "presupuestado" ? "Actualizar presupuesto del cliente" : "Enviar presupuesto al cliente"}</button>
              {a.estado === "enviado" && <button name="enviar" value="0" className="btn-ghost" formNoValidate>Guardar sin enviar</button>}
            </div>
          </div>
        )}
      </form>

      {a.estado === "presupuestado" && c?.telefono && (
        <p className="muted text-sm">
          El cliente ya lo ve en su panel y le llegó un mensaje al chat. Si querés que se entere enseguida,{" "}
          <a className="link" href={appWhatsApp(c.telefono, aviso)}>avisale por WhatsApp</a>.
        </p>
      )}
    </div>
  );
}
