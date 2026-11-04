import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ACCESORIOS, SERVICIOS, TIPOS_INSTRUMENTO } from "@/lib/estados";
import { recibirInstrumento } from "../actions";
import { BotonGuardar } from "@/components/BotonGuardar";
import { CampoEmail } from "@/components/CampoEmail";

/** Recepción del instrumento en un solo formulario (cliente + instrumento + orden). */
export default async function RecibirPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const { cliente: clienteId } = await searchParams;
  const supabase = await createClient();
  const { data: cliente } = clienteId
    ? await supabase.from("clientes").select("id, codigo, nombre, telefono").eq("id", clienteId).maybeSingle()
    : { data: null };

  const seccion = "card space-y-3";
  const titulo = (n: number, t: string) => (
    <h2 className="flex items-center gap-2 font-semibold">
      <span className="grid h-6 w-6 place-items-center rounded-full text-xs text-white" style={{ background: "var(--accent)" }}>{n}</span>{t}
    </h2>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/taller" className="muted text-sm hover:underline">← Trabajos</Link>
        <h1 className="text-2xl font-semibold">Recibir instrumento</h1>
        <p className="muted text-sm">Completá los datos al recibirlo. Al guardar se abre la orden de trabajo, donde podés subir las fotos del estado en que llegó.</p>
      </div>

      <form action={recibirInstrumento} className="space-y-4">
        {/* 1. Cliente */}
        <section className={seccion}>
          {titulo(1, "Datos del cliente")}
          {cliente ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <input type="hidden" name="cliente_id" value={cliente.id} />
              <span className="font-mono">{cliente.codigo}</span>
              <span className="font-medium">{cliente.nombre}</span>
              <span className="muted">{cliente.telefono}</span>
              <Link href="/taller/recibir" className="link ml-auto">Cambiar cliente</Link>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="field"><span>Nombre y apellido *</span><input name="nombre" required autoComplete="off" /></label>
                <label className="field"><span>Teléfono / WhatsApp *</span><input name="telefono" required inputMode="tel" autoComplete="off" placeholder="11 2345 6789" /></label>
              </div>
              <CampoEmail autoComplete="off" />
              <p className="muted text-xs">Si el teléfono ya es de un cliente, la orden se le asigna a él (no se duplica).</p>
            </>
          )}
        </section>

        {/* 2. Instrumento */}
        <section className={seccion}>
          {titulo(2, "Instrumento")}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="field"><span>Tipo *</span>
              <select name="tipo" required defaultValue="">
                <option value="" disabled>Elegí…</option>
                {TIPOS_INSTRUMENTO.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="field"><span>Marca</span><input name="marca" /></label>
            <label className="field"><span>Modelo</span><input name="modelo" /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="field"><span>N° de serie</span><input name="numero_serie" /></label>
            <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="sin_serie" /> No tiene / no se ve</label>
          </div>
        </section>

        {/* 3. Trabajo */}
        <section className={seccion}>
          {titulo(3, "Qué hay que hacerle")}
          <label className="field"><span>Servicio</span>
            <select name="servicio">{SERVICIOS.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <label className="field"><span>Detalle del trabajo / lo que pide el cliente</span>
            <textarea name="problema" rows={3} placeholder="Ej.: calibración completa, trastea en la 3ra cuerda, cambiar jack…" />
          </label>
          <label className="field"><span>Insumos que requiere (uno por línea)</span>
            <textarea name="insumos" rows={3} placeholder={"Juego de cuerdas 10-46\nJack 6,5 mm\nAceite de diapasón"} />
          </label>
        </section>

        {/* 4. Accesorios */}
        <section className={seccion}>
          {titulo(4, "Accesorios que deja")}
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {ACCESORIOS.map((a) => (
              <label key={a} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "var(--line)" }}>
                <input type="checkbox" name="accesorios" value={a} /> {a}
              </label>
            ))}
          </div>
          <label className="field"><span>Otros (separados por coma)</span><input name="accesorios_otros" placeholder="Ej.: capo, slide" /></label>
        </section>

        {/* 5. Estimado */}
        <section className={seccion}>
          {titulo(5, "Estimado de la reparación")}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field"><span>Valor estimado ($)</span><input name="presupuesto" inputMode="decimal" placeholder="Ej.: 45000" /></label>
            <label className="field"><span>Fecha estimada de entrega</span><input name="fecha_estimada" type="date" /></label>
          </div>
          <label className="field"><span>Notas internas (el cliente no las ve)</span><textarea name="notas_internas" rows={2} placeholder="Estado al ingresar: golpe en el clavijero, rayón en la tapa…" /></label>
        </section>

        <div className="flex justify-end"><BotonGuardar className="btn px-8">Recibir y crear orden</BotonGuardar></div>
      </form>
    </div>
  );
}
