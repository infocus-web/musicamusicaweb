import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_ACTIVOS, appWhatsApp, linkSeguimiento } from "@/lib/estados";
import { EstadoBadge } from "@/components/EstadoBadge";
import { ChatTaller } from "./ChatTaller";
import { obtenerAjustes } from "@/lib/ajustes";

export default async function ChatClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: c } = await supabase.from("clientes").select("id, codigo, nombre, telefono, email, token").eq("id", id).maybeSingle();
  if (!c) notFound();
  const { data: trabajos } = await supabase.from("trabajos").select("id, numero, estado, instrumentos(tipo, marca, modelo)")
    .eq("cliente_id", id).in("estado", ESTADOS_ACTIVOS).order("fecha_ingreso", { ascending: false });
  const ordenes = (trabajos ?? []).map((t) => {
    const i = t.instrumentos as unknown as { tipo: string; marca: string | null; modelo: string | null } | null;
    return { id: t.id, numero: t.numero, estado: t.estado, nombre: `${[i?.tipo, i?.marca, i?.modelo].filter(Boolean).join(" ")} (${t.numero})` };
  });
  const rapidas = ((await obtenerAjustes()).respuestas_rapidas ?? "").split("\n").map((r) => r.trim()).filter(Boolean);
  const aviso = `Hola ${c.nombre.split(" ")[0]}! Te respondimos en tu panel de Música Música Web: ${linkSeguimiento(c.token)}?tab=mensajes`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="mr-auto">
          <Link href="/taller/mensajes" className="muted text-sm hover:underline">← Mensajes</Link>
          <h1 className="text-2xl font-semibold">{c.nombre} <span className="muted font-mono text-base">{c.codigo}</span></h1>
          <p className="muted text-sm">{[c.telefono, c.email].filter(Boolean).join(" · ")}</p>
        </div>
        <a href={appWhatsApp(c.telefono, `Hola ${c.nombre.split(" ")[0]}! `)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: "#25D366" }}>Abrir su WhatsApp</a>
        <Link href={`/taller/clientes/${c.id}`} className="btn-ghost">Ficha del cliente</Link>
      </div>

      {ordenes.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {ordenes.map((o) => (
            <Link key={o.id} href={`/taller/trabajos/${o.id}`} className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "var(--line)" }}>
              <span className="font-mono">{o.numero}</span><EstadoBadge estado={o.estado} />
            </Link>
          ))}
        </div>
      )}

      <ChatTaller clienteId={c.id} rapidas={rapidas} ordenes={ordenes.map((o) => ({ id: o.id, nombre: o.nombre }))} />
      <p className="muted text-xs">
        El cliente ve tu respuesta en su panel. Si querés que se entere enseguida,{" "}
        <a className="link" href={appWhatsApp(c.telefono, aviso)}>avisale por WhatsApp que le respondiste</a>.
      </p>
    </div>
  );
}
