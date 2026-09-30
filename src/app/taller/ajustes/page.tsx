import { redirect } from "next/navigation";
import { obtenerStaff } from "@/lib/auth";
import { obtenerAjustes } from "@/lib/ajustes";
import { guardarAjustes } from "./actions";
import { ImagenBanner } from "./ImagenBanner";

export default async function AjustesPage() {
  const { staff } = await obtenerStaff();
  if (staff?.rol !== "admin") redirect("/taller");
  const a = await obtenerAjustes();
  return (
    <form action={guardarAjustes} className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ajustes del sitio</h1>
        <p className="muted text-sm">Estos datos se usan en toda la web: botones de WhatsApp, pie de página, contacto, quiénes somos y términos.</p>
      </div>
      <section className="card grid gap-3 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Banner de la portada</h2>
        <ImagenBanner inicial={a.hero_imagen} />
        <label className="field sm:col-span-2"><span>Título</span><input name="hero_titulo" defaultValue={a.hero_titulo ?? ""} placeholder="Tu instrumento, en manos de luthiers." /></label>
        <label className="field sm:col-span-2"><span>Bajada</span><input name="hero_texto" defaultValue={a.hero_texto ?? ""} placeholder="Calibración, reparación y puesta a punto. Seguí el avance online." /></label>
        <label className="field"><span>Texto del botón</span><input name="hero_boton" defaultValue={a.hero_boton ?? ""} placeholder="Pedí tu service" /></label>
        <label className="field"><span>Link del botón</span><input name="hero_link" defaultValue={a.hero_link ?? ""} placeholder="/asesor" /></label>
      </section>
      <section className="card grid gap-3 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Contacto</h2>
        <label className="field"><span>WhatsApp del taller</span><input name="whatsapp" defaultValue={a.whatsapp ?? ""} placeholder="11 2345 6789" inputMode="tel" /></label>
        <label className="field"><span>Email de contacto</span><input name="email" type="email" defaultValue={a.email ?? ""} /></label>
        <label className="field sm:col-span-2"><span>Dirección</span><input name="direccion" defaultValue={a.direccion ?? ""} placeholder="Calle 123, Ciudad" /></label>
        <label className="field"><span>Horarios</span><input name="horarios" defaultValue={a.horarios ?? ""} placeholder="Lun a Vie 10 a 19 h · Sáb 10 a 14 h" /></label>
        <label className="field"><span>Instagram (usuario)</span><input name="instagram" defaultValue={a.instagram ?? ""} placeholder="musicamusicaweb" /></label>
      </section>
      <section className="card grid gap-3 sm:grid-cols-[1fr_200px]">
        <h2 className="font-semibold sm:col-span-2">Tienda: pago por transferencia</h2>
        <label className="field"><span>Datos para transferir (se muestran al cliente)</span>
          <textarea name="transferencia_datos" rows={4} defaultValue={a.transferencia_datos ?? ""} placeholder={"Titular: …\nCBU/CVU: …\nAlias: …\nBanco: …"} />
        </label>
        <label className="field"><span>Descuento por transferencia (%)</span><input name="transferencia_descuento" inputMode="numeric" defaultValue={a.transferencia_descuento ?? ""} placeholder="10" /></label>
      </section>
      <section className="card space-y-3">
        <h2 className="font-semibold">Quiénes somos</h2>
        <textarea name="quienes_somos" rows={8} defaultValue={a.quienes_somos ?? ""} className="w-full rounded-xl border p-3 text-base" style={{ borderColor: "var(--line)", background: "var(--bg)" }} placeholder="Contá la historia del taller, quiénes trabajan, cuántos años de experiencia…" />
      </section>
      <section className="card space-y-3">
        <h2 className="font-semibold">Términos y condiciones</h2>
        <p className="muted text-xs">Si lo dejás vacío se muestra un texto base. Conviene que lo revise un abogado o contador.</p>
        <textarea name="terminos" rows={12} defaultValue={a.terminos ?? ""} className="w-full rounded-xl border p-3 text-base" style={{ borderColor: "var(--line)", background: "var(--bg)" }} />
      </section>
      <button className="btn">Guardar ajustes</button>
    </form>
  );
}
