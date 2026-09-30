import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estrellas, type Caso, type Resena } from "@/lib/casos";
import { borrarCaso, guardarCaso } from "../actions";
import { MediaEditor } from "./MediaEditor";

export default async function EditarCasoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("casos").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const c = data as Caso;
  const { data: resenas } = await supabase.from("resenas").select("*").eq("autoriza_publicar", true).order("creado_en", { ascending: false }).limit(100);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/taller/nuestros-clientes" className="muted text-sm hover:underline">← Nuestros clientes</Link>
        <h1 className="text-2xl font-semibold">{c.titulo}</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <form action={guardarCaso.bind(null, c.id)} className="card grid gap-3 sm:grid-cols-2">
          <label className="field sm:col-span-2"><span>Título</span><input name="titulo" defaultValue={c.titulo} required /></label>
          <label className="field"><span>Instrumento</span><input name="instrumento" defaultValue={c.instrumento ?? ""} /></label>
          <label className="field"><span>Servicio</span><input name="servicio" defaultValue={c.servicio ?? ""} /></label>
          <label className="field sm:col-span-2"><span>Qué hicimos (se muestra en la web)</span><textarea name="descripcion" rows={5} defaultValue={c.descripcion ?? ""} placeholder="Llegó con los trastes gastados y zumbido en las cuerdas graves. Hicimos nivelado y coronado…" /></label>
          <label className="field sm:col-span-2"><span>Opinión del cliente</span>
            <select name="resena_id" defaultValue={c.resena_id ?? ""}>
              <option value="">Sin opinión</option>
              {((resenas ?? []) as Resena[]).map((r) => (
                <option key={r.id} value={r.id}>{estrellas(r.puntaje)} {r.nombre_publico} — {(r.comentario ?? "").slice(0, 60)}{r.aprobada ? "" : " (no aprobada)"}</option>
              ))}
            </select>
          </label>
          <label className="field"><span>Orden (mayor = primero)</span><input name="orden" inputMode="numeric" defaultValue={c.orden} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publicado" defaultChecked={c.publicado} /> Publicado en la web</label>
          <div className="flex items-center justify-between sm:col-span-2">
            <button formAction={borrarCaso.bind(null, c.id)} formNoValidate className="text-sm text-red-600 hover:underline">Borrar</button>
            <button className="btn">Guardar</button>
          </div>
        </form>
        <MediaEditor id={c.id} inicial={c.media} />
      </div>
    </div>
  );
}
