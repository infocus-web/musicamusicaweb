import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { guardarEnvios } from "../actions";

const TIPO: Record<string, string> = { retiro: "Retiro (gratis)", fijo: "Costo fijo", correo: "Correo: se cotiza en cada pedido", moto: "Moto/cadete: se coordina por WhatsApp" };

export default async function EnviosPage() {
  const supabase = await createClient();
  const { data: envios } = await supabase.from("envios").select("*").order("orden");
  return (
    <form action={guardarEnvios} className="max-w-3xl space-y-4">
      <div>
        <Link href="/taller/tienda" className="muted text-sm hover:underline">← Tienda</Link>
        <h1 className="text-2xl font-semibold">Formas de entrega</h1>
        <p className="muted text-sm">Lo que tildes como activo aparece en el checkout. Los datos de transferencia se cargan en Ajustes.</p>
      </div>
      {(envios ?? []).map((e) => (
        <section key={e.id} className="card grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={e.id} />
          <div className="flex items-center justify-between sm:col-span-2">
            <span className="muted text-sm">{TIPO[e.tipo]}</span>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={`activo_${e.id}`} defaultChecked={e.activo} /> Activo</label>
          </div>
          <label className="field"><span>Nombre</span><input name={`nombre_${e.id}`} defaultValue={e.nombre} /></label>
          <label className="field"><span>Detalle para el cliente</span><input name={`detalle_${e.id}`} defaultValue={e.detalle ?? ""} /></label>
          {e.tipo === "fijo" && (
            <>
              <label className="field"><span>Costo ($)</span><input name={`precio_${e.id}`} inputMode="decimal" defaultValue={e.precio} /></label>
              <label className="field"><span>Gratis desde ($, opcional)</span><input name={`gratis_${e.id}`} inputMode="decimal" defaultValue={e.gratis_desde ?? ""} /></label>
            </>
          )}
        </section>
      ))}
      <button className="btn">Guardar</button>
    </form>
  );
}
