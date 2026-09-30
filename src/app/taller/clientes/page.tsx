import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { crearCliente } from "../actions";
import { CopiarLink } from "@/components/CopiarLink";
import { siteUrl } from "@/lib/estados";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string; nuevos?: string }> }) {
  const { q, nuevos } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("clientes").select("id, codigo, nombre, telefono, email, origen, revisado").order("creado_en", { ascending: false }).limit(200);
  if (q) {
    const s = q.replace(/[%,()]/g, " ");
    query = query.or(`nombre.ilike.%${s}%,codigo.ilike.%${s}%,telefono.ilike.%${s}%`);
  }
  if (nuevos) query = query.eq("revisado", false);
  const { data: clientes } = await query;
  const { count: sinRevisar } = await supabase.from("clientes").select("id", { count: "exact", head: true }).eq("revisado", false);

  const linkRegistro = `${siteUrl()}/registro`;
  const textoRegistro = `¡Hola! Para registrarte como cliente de Música Música Web y seguir tus instrumentos online, completá tus datos acá: ${linkRegistro}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <h1 className="mr-auto text-2xl font-semibold">Clientes</h1>
          <Link href="/taller/clientes/importar" className="btn-ghost">Importar CSV</Link>
          <form className="flex gap-2">
            <input name="q" defaultValue={q} placeholder="Nombre, código o teléfono" className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--card)" }} />
            <button className="btn-ghost">Buscar</button>
          </form>
        </div>
        {(sinRevisar ?? 0) > 0 && (
          <Link href={nuevos ? "/taller/clientes" : "/taller/clientes?nuevos=1"} className="block rounded-xl p-3 text-sm" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
            {nuevos ? "← Ver todos los clientes" : `${sinRevisar} cliente(s) se registraron solos y falta revisarlos → ver`}
          </Link>
        )}
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="muted text-left">
              <tr><th className="p-3">Código</th><th className="p-3">Nombre</th><th className="p-3">Teléfono</th><th className="p-3">Email</th></tr>
            </thead>
            <tbody>
              {(clientes ?? []).map((c) => (
                <tr key={c.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                  <td className="p-3 font-mono"><Link className="link" href={`/taller/clientes/${c.id}`}>{c.codigo}</Link></td>
                  <td className="p-3">
                    <Link href={`/taller/clientes/${c.id}`}>{c.nombre}</Link>
                    {!c.revisado && <span className="badge ml-2 bg-red-100 text-red-700">Nuevo</span>}
                  </td>
                  <td className="p-3">{c.telefono ?? "—"}</td>
                  <td className="p-3">{c.email ?? "—"}</td>
                </tr>
              ))}
              {(clientes ?? []).length === 0 && (
                <tr><td colSpan={4} className="muted p-3">Todavía no hay clientes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="card space-y-3">
          <h2 className="text-lg font-semibold">Link de registro</h2>
          <p className="muted text-xs">Compartilo y cada cliente carga sus datos y su instrumento. Aparece acá marcado como “Nuevo”.</p>
          <p className="break-all font-mono text-xs">{linkRegistro}</p>
          <div className="flex flex-wrap gap-2">
            <CopiarLink url={linkRegistro} />
            <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(textoRegistro)}`} target="_blank" rel="noreferrer">Compartir por WhatsApp</a>
          </div>
        </section>

        <form action={crearCliente} className="card space-y-3">
          <h2 className="text-lg font-semibold">Nuevo cliente</h2>
          <p className="muted text-xs">El código (MM-0001…) y el link privado se generan solos.</p>
          <label className="field"><span>Nombre *</span><input name="nombre" required /></label>
          <label className="field"><span>Teléfono (WhatsApp)</span><input name="telefono" inputMode="tel" placeholder="11 2345 6789" /></label>
          <label className="field"><span>Email</span><input name="email" type="email" /></label>
          <label className="field"><span>Notas</span><textarea name="notas" rows={2} /></label>
          <button className="btn w-full">Crear cliente</button>
        </form>
      </aside>
    </div>
  );
}
