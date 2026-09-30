"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoResena = undefined | { error: string } | { ok: true };

/**
 * El cliente deja su opinión sobre un trabajo terminado.
 * Se identifica con el token de su link privado o con su sesión de Mi cuenta.
 */
export async function dejarResena(trabajoId: string, token: string | null, _p: EstadoResena, fd: FormData): Promise<EstadoResena> {
  const db = createAdminClient();
  let clienteId: string | null = null;
  if (token && /^[a-f0-9]{32}$/.test(token)) {
    clienteId = (await db.from("clientes").select("id").eq("token", token).maybeSingle()).data?.id ?? null;
  } else {
    const { data: { user } } = await (await createClient()).auth.getUser();
    if (user) clienteId = (await db.from("clientes").select("id").eq("user_id", user.id).maybeSingle()).data?.id ?? null;
  }
  if (!clienteId) return { error: "No pudimos verificar tu cuenta." };

  const { data: t } = await db.from("trabajos").select("id, estado").eq("id", trabajoId).eq("cliente_id", clienteId).maybeSingle();
  if (!t || !["listo", "entregado"].includes(t.estado)) return { error: "Podés opinar cuando el trabajo esté terminado." };

  const puntaje = Number(fd.get("puntaje"));
  if (!(puntaje >= 1 && puntaje <= 5)) return { error: "Elegí de 1 a 5 estrellas." };
  const { data: c } = await db.from("clientes").select("nombre").eq("id", clienteId).single();
  const partes = (c?.nombre ?? "").trim().split(/\s+/);
  const nombrePublico = partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1][0]}.` : partes[0] || "Cliente";

  const { error } = await db.from("resenas").insert({
    trabajo_id: trabajoId,
    cliente_id: clienteId,
    puntaje: Math.round(puntaje),
    comentario: String(fd.get("comentario") ?? "").trim().slice(0, 1500) || null,
    nombre_publico: nombrePublico,
    autoriza_publicar: fd.get("autoriza") === "on",
  });
  if (error) return { error: error.code === "23505" ? "Ya dejaste tu opinión sobre este trabajo. ¡Gracias!" : "No se pudo guardar." };
  revalidatePath("/taller/nuestros-clientes");
  return { ok: true };
}
