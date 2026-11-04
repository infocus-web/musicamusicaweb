import { createClient } from "@/lib/supabase/server";
import { formatoFecha } from "@/lib/estados";
import { BotonGuardar } from "@/components/BotonGuardar";
import { alternarNovedad, borrarNovedad, crearNovedad } from "./actions";

/** Novedades que ven todos los clientes en el inicio de su panel. */
export default async function NovedadesPage() {
  const { data } = await (await createClient()).from("novedades").select("*").order("creado_en", { ascending: false }).limit(100);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Novedades para clientes</h1>
        <p className="muted text-sm">Aparecen en el inicio del panel de cada cliente: promos, horarios, avisos, productos nuevos.</p>
      </div>
      <form action={crearNovedad} className="card space-y-3">
        <label className="field"><span>Título *</span><input name="titulo" required maxLength={160} placeholder="Ej.: Llegaron cuerdas Ernie Ball" /></label>
        <label className="field"><span>Texto</span><textarea name="texto" rows={3} placeholder="Podés usar **negrita** y listas con guion." /></label>
        <label className="field"><span>Link (opcional)</span><input name="link" placeholder="/tienda?cat=cuerdas o https://…" /></label>
        <BotonGuardar className="btn">Publicar novedad</BotonGuardar>
      </form>
      <div className="space-y-3">
        {(data ?? []).length === 0 && <p className="card muted text-sm">Todavía no publicaste novedades.</p>}
        {(data ?? []).map((n) => (
          <article key={n.id} className="card flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{n.titulo} {!n.publicada && <span className="badge bg-zinc-200 text-zinc-700">Oculta</span>}</p>
              {n.texto && <p className="muted line-clamp-2 text-sm">{n.texto}</p>}
              <p className="muted text-xs">{formatoFecha(n.creado_en)}</p>
            </div>
            <form action={alternarNovedad.bind(null, n.id, !n.publicada)}><button className="btn-ghost !py-1.5 text-sm">{n.publicada ? "Ocultar" : "Mostrar"}</button></form>
            <form action={borrarNovedad.bind(null, n.id)}><button className="!py-1.5 text-sm text-red-600 hover:underline">Borrar</button></form>
          </article>
        ))}
      </div>
    </div>
  );
}
