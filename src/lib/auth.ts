import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Rol = "admin" | "tecnico";
export type Staff = { user_id: string; nombre: string | null; rol: Rol; email: string | null };

/** Usuario logueado + su registro de personal (null si no es del taller). */
/** Cuenta principal del taller: nadie más puede quitarle el acceso, bajarle el rol ni cambiarle la clave. */
export const EMAIL_DUENIO = "tallermusicamusicaweb@gmail.com";

export async function obtenerStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, staff: null };
  const { data: staff } = await supabase
    .from("staff")
    .select("user_id, nombre, rol, email")
    .eq("user_id", user.id)
    .maybeSingle();
  return { user, staff: (staff as Staff | null) ?? null };
}

/** Para Server Actions/páginas que solo puede usar un administrador. */
export async function exigirAdmin() {
  const { user, staff } = await obtenerStaff();
  if (!user) redirect("/login");
  if (staff?.rol !== "admin") throw new Error("Solo un administrador puede hacer esto.");
  return { user, staff };
}

/** Email interno con el que entra un cliente (no se usa para mandar correos). */
export function emailCliente(codigo: string) {
  return `${codigo.trim().toLowerCase()}@clientes.musicamusicaweb.com.ar`;
}

/** Clave fácil de dictar por WhatsApp: sin letras ni números que se confundan. */
export function generarClave(largo = 8) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(largo));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
