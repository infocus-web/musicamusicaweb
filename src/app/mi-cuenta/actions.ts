"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { emailCliente } from "@/lib/auth";
import { rutaSegura } from "@/lib/cliente-actual";

/**
 * Ingreso del cliente con lo que se acuerde: teléfono, email o código de cliente, y su clave.
 */
export async function ingresarCliente(_prev: { error?: string } | undefined, fd: FormData) {
  const usuario = String(fd.get("usuario") ?? fd.get("codigo") ?? "").trim();
  const clave = String(fd.get("clave") ?? "");
  if (!usuario || !clave) return { error: "Completá tu teléfono (o email) y tu clave." };

  // Buscamos el código del cliente según lo que escribió.
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { claveTelefono } = await import("@/lib/csv");
  const db = createAdminClient();
  let codigo: string | null = null;
  const cod = usuario.toUpperCase().replace(/\s/g, "");
  if (/^MM-?\d{1,6}$/.test(cod)) codigo = cod.includes("-") ? cod : cod.replace(/^MM/, "MM-");
  else if (usuario.includes("@")) codigo = (await db.from("clientes").select("codigo").ilike("email", usuario).not("user_id", "is", null).limit(1).maybeSingle()).data?.codigo ?? null;
  else {
    const tel = claveTelefono(usuario);
    if (tel) codigo = (await db.from("clientes").select("codigo").eq("telefono_norm", tel).not("user_id", "is", null).limit(1).maybeSingle()).data?.codigo ?? null;
  }
  if (!codigo) return { error: "No encontramos una cuenta con esos datos. Si no creaste tu clave todavía, entrá con el link que te mandamos por WhatsApp." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: emailCliente(codigo), password: clave });
  if (error) return { error: "La clave no es correcta." };
  redirect(rutaSegura(fd.get("volver")) ?? "/mi-cuenta");
}

export async function salirCliente() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/mi-cuenta/ingresar");
}
