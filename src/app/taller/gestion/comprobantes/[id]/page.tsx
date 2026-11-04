import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerAjustes } from "@/lib/ajustes";
import { appWhatsApp } from "@/lib/estados";
import { numeroComprobante } from "@/lib/gestion";
import { Comprobante, type DatosComprobante } from "@/components/Comprobante";
import { BotonImprimir } from "@/components/BotonImprimir";
import { anularComprobante } from "../actions";

export default async function ComprobantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: c } = await (await createClient()).from("comprobantes").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();
  const a = await obtenerAjustes();
  const volver = c.trabajo_id ? `/taller/trabajos/${c.trabajo_id}` : c.pedido_id ? `/taller/pedidos/${c.pedido_id}` : "/taller/gestion/comprobantes";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Link href={volver} className="muted mr-auto text-sm hover:underline">← Volver</Link>
        <BotonImprimir />
        {c.cliente_telefono && <a className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: "#25D366" }}
          href={appWhatsApp(c.cliente_telefono, `Hola ${c.cliente_nombre.split(" ")[0]}! Te paso el comprobante N° ${numeroComprobante(c.numero)}. Gracias!`)}>WhatsApp al cliente</a>}
        {!c.anulado && <form action={anularComprobante.bind(null, c.id)}><button className="btn-ghost text-red-600">Anular</button></form>}
      </div>
      <p className="muted text-xs print:hidden">Para mandarlo por WhatsApp: tocá “Imprimir / Guardar PDF”, elegí “Guardar como PDF” y adjuntá el archivo en el chat.</p>
      <Comprobante c={c as DatosComprobante} a={a} />
    </div>
  );
}
