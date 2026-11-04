import { createClient } from "@/lib/supabase/server";
import { appWhatsApp, formatoPesos } from "@/lib/estados";
import { BotonGuardar } from "@/components/BotonGuardar";
import { alternarProveedor, guardarProveedor } from "./actions";

export default async function ProveedoresPage() {
  const supabase = await createClient();
  const [{ data: proveedores }, { data: compras }] = await Promise.all([
    supabase.from("proveedores").select("*").order("activo", { ascending: false }).order("nombre"),
    supabase.from("compras").select("proveedor_id, total").eq("anulada", false),
  ]);
  const totalDe = (id: string) => (compras ?? []).filter((c) => c.proveedor_id === id).reduce((a, c) => a + Number(c.total), 0);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        {(proveedores ?? []).length === 0 && <p className="card muted text-sm">Todavía no cargaste proveedores.</p>}
        {(proveedores ?? []).map((p) => (
          <details key={p.id} className="card !p-0">
            <summary className="flex cursor-pointer flex-wrap items-center gap-3 p-4">
              <span className={`flex-1 font-semibold ${p.activo ? "" : "muted line-through"}`}>{p.nombre}</span>
              <span className="muted text-sm">{[p.telefono, p.email].filter(Boolean).join(" · ")}</span>
              <span className="text-sm">Compras: <b>{formatoPesos(totalDe(p.id))}</b></span>
              {p.telefono && <a href={appWhatsApp(p.telefono, "Hola! Te escribo de Música Música Web. ")} className="rounded-lg px-3 py-1 text-sm font-semibold text-white" style={{ background: "#25D366" }}>WhatsApp</a>}
            </summary>
            <form action={guardarProveedor.bind(null, p.id)} className="grid gap-3 border-t p-4 sm:grid-cols-2" style={{ borderColor: "var(--line)" }}>
              <label className="field"><span>Nombre</span><input name="nombre" defaultValue={p.nombre} required /></label>
              <label className="field"><span>CUIT</span><input name="cuit" defaultValue={p.cuit ?? ""} /></label>
              <label className="field"><span>Teléfono</span><input name="telefono" defaultValue={p.telefono ?? ""} /></label>
              <label className="field"><span>Email</span><input name="email" defaultValue={p.email ?? ""} /></label>
              <label className="field sm:col-span-2"><span>Notas</span><textarea name="notas" rows={2} defaultValue={p.notas ?? ""} /></label>
              <div className="flex items-center justify-between sm:col-span-2">
                <button formAction={alternarProveedor.bind(null, p.id, !p.activo)} formNoValidate className="muted text-sm hover:underline">{p.activo ? "Desactivar" : "Activar"}</button>
                <BotonGuardar />
              </div>
            </form>
          </details>
        ))}
      </div>
      <form action={guardarProveedor.bind(null, null)} className="card h-fit space-y-3">
        <h2 className="font-semibold">Nuevo proveedor</h2>
        <label className="field"><span>Nombre *</span><input name="nombre" required /></label>
        <label className="field"><span>CUIT</span><input name="cuit" /></label>
        <label className="field"><span>Teléfono / WhatsApp</span><input name="telefono" inputMode="tel" /></label>
        <label className="field"><span>Email</span><input name="email" type="email" /></label>
        <label className="field"><span>Notas</span><textarea name="notas" rows={2} placeholder="Qué le comprás, condiciones, días de entrega…" /></label>
        <BotonGuardar className="btn w-full">Agregar proveedor</BotonGuardar>
      </form>
    </div>
  );
}
