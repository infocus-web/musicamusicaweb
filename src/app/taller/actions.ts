"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function txt(fd: FormData, key: string) {
  const v = String(fd.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function num(fd: FormData, key: string) {
  const v = txt(fd, key);
  if (v == null) return null;
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function crearCliente(fd: FormData) {
  const supabase = await createClient();
  const nombre = txt(fd, "nombre");
  if (!nombre) throw new Error("Falta el nombre");
  const { data, error } = await supabase
    .from("clientes")
    .insert({ nombre, telefono: txt(fd, "telefono"), email: txt(fd, "email"), notas: txt(fd, "notas") })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  redirect(`/taller/clientes/${data.id}`);
}

export async function actualizarCliente(id: string, fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({ nombre: txt(fd, "nombre"), telefono: txt(fd, "telefono"), email: txt(fd, "email"), notas: txt(fd, "notas") })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/taller/clientes/${id}`);
}

/** Genera un link nuevo (el anterior deja de funcionar). */
export async function regenerarLink(id: string) {
  const supabase = await createClient();
  const token = crypto.randomUUID().replace(/-/g, "");
  const { error } = await supabase.from("clientes").update({ token }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/taller/clientes/${id}`);
}

export async function crearInstrumento(clienteId: string, fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("instrumentos").insert({
    cliente_id: clienteId,
    tipo: txt(fd, "tipo") ?? "Otro",
    marca: txt(fd, "marca"),
    modelo: txt(fd, "modelo"),
    numero_serie: txt(fd, "numero_serie"),
    notas: txt(fd, "notas"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/taller/clientes/${clienteId}`);
}

export async function crearTrabajo(clienteId: string, fd: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trabajos")
    .insert({
      cliente_id: clienteId,
      instrumento_id: txt(fd, "instrumento_id"),
      servicio: txt(fd, "servicio") ?? "Otro",
      problema: txt(fd, "problema"),
      presupuesto: num(fd, "presupuesto"),
      fecha_estimada: txt(fd, "fecha_estimada"),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await supabase.from("avances").insert({
    trabajo_id: data.id,
    estado: "recibido",
    descripcion: "Recibimos tu instrumento en el taller.",
  });
  redirect(`/taller/trabajos/${data.id}`);
}

export async function actualizarTrabajo(id: string, fd: FormData) {
  const supabase = await createClient();
  const { data: previo } = await supabase.from("trabajos").select("estado").eq("id", id).single();
  const estado = txt(fd, "estado") ?? previo?.estado ?? "recibido";
  const cambios: Record<string, unknown> = {
    estado,
    servicio: txt(fd, "servicio"),
    problema: txt(fd, "problema"),
    presupuesto: num(fd, "presupuesto"),
    presupuesto_aprobado: fd.get("presupuesto_aprobado") === "on",
    fecha_estimada: txt(fd, "fecha_estimada"),
    notas_internas: txt(fd, "notas_internas"),
  };
  if (estado === "entregado") cambios.fecha_entrega = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("trabajos").update(cambios).eq("id", id);
  if (error) throw new Error(error.message);

  // Si cambió el estado, queda registrado como avance visible para el cliente.
  if (previo && previo.estado !== estado) {
    await supabase.from("avances").insert({ trabajo_id: id, estado, descripcion: null });
  }
  revalidatePath(`/taller/trabajos/${id}`);
  revalidatePath("/taller");
}

/** Se llama después de que el navegador subió el archivo al bucket "avances". */
export async function crearAvance(input: {
  trabajoId: string;
  descripcion: string | null;
  mediaPath: string | null;
  mediaTipo: "video" | "foto" | null;
  visibleCliente: boolean;
}) {
  const supabase = await createClient();
  const { data: t } = await supabase.from("trabajos").select("estado").eq("id", input.trabajoId).single();
  const { error } = await supabase.from("avances").insert({
    trabajo_id: input.trabajoId,
    estado: t?.estado ?? null,
    descripcion: input.descripcion,
    media_path: input.mediaPath,
    media_tipo: input.mediaTipo,
    visible_cliente: input.visibleCliente,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/taller/trabajos/${input.trabajoId}`);
}

export async function borrarAvance(id: string, trabajoId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("avances").select("media_path").eq("id", id).single();
  if (data?.media_path) await supabase.storage.from("avances").remove([data.media_path]);
  const { error } = await supabase.from("avances").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/taller/trabajos/${trabajoId}`);
}

/**
 * Crea (o renueva) la clave de un cliente para entrar en /mi-cuenta con su código.
 * Devuelve la clave UNA sola vez para mandársela por WhatsApp.
 */
export async function generarClaveCliente(
  clienteId: string,
  _prev: { clave?: string; error?: string } | undefined,
): Promise<{ clave?: string; error?: string }> {
  const { obtenerStaff, emailCliente, generarClave } = await import("@/lib/auth");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { staff } = await obtenerStaff();
  if (!staff) return { error: "Sin permiso." };

  const admin = createAdminClient();
  const { data: c } = await admin.from("clientes").select("id, codigo, nombre, user_id").eq("id", clienteId).single();
  if (!c) return { error: "Cliente no encontrado." };

  const clave = generarClave();
  if (c.user_id) {
    const { error } = await admin.auth.admin.updateUserById(c.user_id, { password: clave, ban_duration: "none" });
    if (error) return { error: error.message };
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: emailCliente(c.codigo),
      password: clave,
      email_confirm: true,
      user_metadata: { tipo: "cliente", codigo: c.codigo, nombre: c.nombre },
    });
    if (error || !data.user) return { error: error?.message ?? "No se pudo crear el acceso." };
    const { error: e2 } = await admin.from("clientes").update({ user_id: data.user.id }).eq("id", c.id);
    if (e2) return { error: e2.message };
  }
  revalidatePath(`/taller/clientes/${clienteId}`);
  return { clave };
}

/** Bloquea el acceso con clave del cliente (el link privado sigue funcionando). */
export async function bloquearAccesoCliente(clienteId: string) {
  const { obtenerStaff } = await import("@/lib/auth");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { staff } = await obtenerStaff();
  if (!staff) throw new Error("Sin permiso.");
  const admin = createAdminClient();
  const { data: c } = await admin.from("clientes").select("user_id").eq("id", clienteId).single();
  if (c?.user_id) {
    await admin.auth.admin.deleteUser(c.user_id);
    await admin.from("clientes").update({ user_id: null }).eq("id", clienteId);
  }
  revalidatePath(`/taller/clientes/${clienteId}`);
}

export async function marcarRevisado(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update({ revisado: true }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/taller/clientes/${id}`);
  revalidatePath("/taller/clientes");
}

/**
 * Borra un cliente para siempre (solo administradores): sus instrumentos, trabajos, fotos/videos de avances
 * y su acceso con clave. Los pedidos de la tienda y las reseñas se conservan, sin el cliente asociado.
 */
export async function borrarCliente(id: string) {
  const { exigirAdmin } = await import("@/lib/auth");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  await exigirAdmin();
  const admin = createAdminClient();
  const { data: c } = await admin.from("clientes").select("id, user_id").eq("id", id).maybeSingle();
  if (!c) redirect("/taller/clientes");

  // Archivos de avances (fotos y videos del taller) de todos sus trabajos.
  const { data: trabajos } = await admin.from("trabajos").select("id").eq("cliente_id", id);
  const ids = (trabajos ?? []).map((t) => t.id);
  if (ids.length) {
    const { data: avances } = await admin.from("avances").select("media_path").in("trabajo_id", ids);
    const rutas = (avances ?? []).map((a) => a.media_path).filter((p): p is string => !!p);
    for (let i = 0; i < rutas.length; i += 100) await admin.storage.from("avances").remove(rutas.slice(i, i + 100));
  }

  const { error } = await admin.from("clientes").delete().eq("id", id); // instrumentos, trabajos y avances se borran en cascada
  if (error) throw new Error(error.message);
  if (c.user_id) await admin.auth.admin.deleteUser(c.user_id);

  revalidatePath("/taller/clientes");
  revalidatePath("/taller");
  redirect("/taller/clientes");
}
