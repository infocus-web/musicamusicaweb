import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIAS_USADOS, CONDICIONES, ESTADOS_USADO, SECCIONES, estadoUsadoInfo, type Usado } from "@/lib/usados";
import { cambiarEstadoUsado, guardarUsado } from "../actions";
import { Fotos } from "./Fotos";
import { BorrarUsado } from "./BorrarUsado";

export default async function EditarUsadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("usados").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const u = data as Usado;
  const e = estadoUsadoInfo(u.estado);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <Link href="/taller/usados" className="muted text-sm hover:underline">← Usados</Link>
          <h1 className="text-2xl font-semibold"><span className="font-mono muted">{u.codigo}</span> {u.titulo}</h1>
        </div>
        <span className={`badge ${e.color}`}>{e.label}</span>
        {u.estado !== "borrador" && <Link href={`/usados/${u.codigo}`} target="_blank" className="btn-ghost">Ver publicación</Link>}
        {u.estado !== "publicado" && <form action={cambiarEstadoUsado.bind(null, u.id, "publicado")}><button className="btn">Publicar</button></form>}
        {u.estado === "publicado" && <form action={cambiarEstadoUsado.bind(null, u.id, "reservado")}><button className="btn-ghost">Reservar</button></form>}
        {u.estado !== "vendido" && u.estado !== "borrador" && <form action={cambiarEstadoUsado.bind(null, u.id, "vendido")}><button className="btn-ghost">Marcar vendido</button></form>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <form action={guardarUsado.bind(null, u.id)} className="card grid grid-cols-2 gap-3">
          <label className="field col-span-2"><span>Título</span><input name="titulo" defaultValue={u.titulo} required placeholder="Fender Stratocaster American Standard 2012" /></label>
          <label className="field"><span>Sección</span>
            <select name="seccion" defaultValue={u.seccion}>{SECCIONES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
          </label>
          <label className="field"><span>Estado de la publicación</span>
            <select name="estado" defaultValue={u.estado}>{ESTADOS_USADO.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
          </label>
          <label className="field"><span>Categoría</span>
            <select name="categoria" defaultValue={u.categoria}>{CATEGORIAS_USADOS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          </label>
          <label className="field"><span>Condición</span>
            <select name="condicion" defaultValue={u.condicion}>{CONDICIONES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          </label>
          <label className="field"><span>Marca</span><input name="marca" defaultValue={u.marca ?? ""} /></label>
          <label className="field"><span>Modelo</span><input name="modelo" defaultValue={u.modelo ?? ""} /></label>
          <label className="field"><span>Año</span><input name="anio" inputMode="numeric" defaultValue={u.anio ?? ""} /></label>
          <label className="field"><span>Moneda</span>
            <select name="moneda" defaultValue={u.moneda}><option value="ARS">Pesos</option><option value="USD">Dólares</option></select>
          </label>
          <label className="field"><span>Precio</span><input name="precio" inputMode="decimal" defaultValue={u.precio ?? ""} placeholder="Vacío = Consultar" /></label>
          <label className="field"><span>Precio anterior (tachado)</span><input name="precio_anterior" inputMode="decimal" defaultValue={u.precio_anterior ?? ""} placeholder="Para liquidación" /></label>
          <label className="field"><span>Garantía (días)</span><input name="garantia_dias" inputMode="numeric" defaultValue={u.garantia_dias ?? ""} /></label>
          <div className="col-span-2 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="precio_negociable" defaultChecked={u.precio_negociable} /> Precio conversable</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="acepta_permuta" defaultChecked={u.acepta_permuta} /> Acepta permuta</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="envio" defaultChecked={u.envio} /> Envío a todo el país</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="destacado" defaultChecked={u.destacado} /> Destacado (sale primero)</label>
          </div>
          <label className="field col-span-2"><span>Descripción</span><textarea name="descripcion" rows={4} defaultValue={u.descripcion ?? ""} /></label>
          <label className="field col-span-2"><span>Características (una por línea)</span><textarea name="caracteristicas" rows={4} defaultValue={u.caracteristicas ?? ""} placeholder={"Cuerpo de aliso\nMástil de maple\nPastillas originales"} /></label>
          <label className="field col-span-2"><span>Qué le hicimos en el taller (una por línea)</span><textarea name="revision" rows={4} defaultValue={u.revision ?? ""} placeholder={"Calibración completa\nLimpieza de potes\nCuerdas nuevas"} /></label>
          <label className="field col-span-2"><span>Incluye (una por línea)</span><textarea name="incluye" rows={2} defaultValue={u.incluye ?? ""} placeholder={"Estuche rígido original"} /></label>
          <div className="col-span-2 flex items-center justify-between gap-3">
            <BorrarUsado id={u.id} />
            <button className="btn">Guardar</button>
          </div>
        </form>

        <Fotos id={u.id} iniciales={u.fotos} />
      </div>
    </div>
  );
}
