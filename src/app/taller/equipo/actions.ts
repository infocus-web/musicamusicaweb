"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMAIL_DUENIO, exigirAdmin, type Rol } from "@/lib/auth";

export type Resultado = { ok?: string; error?: string } | undefined;

async function esDuenio(userId: string) {
  const { data } = await createAdminClient().auth.admin.getUserById(userId);
  return data.user?.email?.toLowerCase() === EMAIL_DUENIO;
}

function rolValido(v: unknown): Rol {
  return v === "admin" ? "admin" : "tecnico";
}

export async function crearIntegrante(_prev: Resultado, fd: FormData): Promise<Resultado> {
  await exigirAdmin();
  const nombre = String(fd.get("nombre") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const clave = String(fd.get("clave") ?? "");
  const rol = rolValido(fd.get("rol"));
  if (!nombre || !email) return { error: "Completá nombre y email." };
  if (clave.length < 8) return { error: "La clave tiene que tener al menos 8 caracteres." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: clave,
    email_confirm: true,
    user_metadata: { nombre },
  });
  if (error || !data.user) {
    return { error: error?.message.includes("already") ? "Ya existe una cuenta con ese email." : `No se pudo crear: ${error?.message}` };
  }
  const { error: e2 } = await admin.from("staff").upsert({ user_id: data.user.id, nombre, rol, email });
  if (e2) return { error: e2.message };
  revalidatePath("/taller/equipo");
  return { ok: `${nombre} ya puede entrar con ${email}.` };
}

export async function cambiarRol(userId: string, fd: FormData) {
  const { user } = await exigirAdmin();
  if (userId === user.id) throw new Error("No podés cambiar tu propio rol.");
  if (await esDuenio(userId)) throw new Error("La cuenta principal del taller no se puede modificar.");
  const admin = createAdminClient();
  const { error } = await admin.from("staff").update({ rol: rolValido(fd.get("rol")) }).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/taller/equipo");
}

export async function cambiarClaveIntegrante(userId: string, _prev: Resultado, fd: FormData): Promise<Resultado> {
  const { user } = await exigirAdmin();
  if (userId !== user.id && (await esDuenio(userId))) return { error: "Solo la cuenta principal puede cambiar su propia clave." };
  const clave = String(fd.get("clave") ?? "");
  if (clave.length < 8) return { error: "Mínimo 8 caracteres." };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: clave });
  if (error) return { error: error.message };
  return { ok: "Clave actualizada." };
}

/** Quita el acceso: deja de ser personal y se bloquea su cuenta. Los trabajos y avances quedan. */
export async function quitarAcceso(userId: string) {
  const { user } = await exigirAdmin();
  if (userId === user.id) throw new Error("No podés quitarte el acceso a vos mismo.");
  if (await esDuenio(userId)) throw new Error("La cuenta principal del taller no se puede quitar.");
  const admin = createAdminClient();
  await admin.from("staff").delete().eq("user_id", userId);
  await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
  revalidatePath("/taller/equipo");
}
