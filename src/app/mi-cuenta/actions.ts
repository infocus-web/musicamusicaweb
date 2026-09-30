"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { emailCliente } from "@/lib/auth";

export async function ingresarCliente(_prev: { error?: string } | undefined, fd: FormData) {
  const codigo = String(fd.get("codigo") ?? "").trim().toUpperCase().replace(/\s/g, "");
  const clave = String(fd.get("clave") ?? "");
  if (!/^MM-?\d{1,6}$/.test(codigo)) return { error: "Revisá el código: tiene la forma MM-0001." };
  const normalizado = codigo.includes("-") ? codigo : codigo.replace(/^MM/, "MM-");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: emailCliente(normalizado), password: clave });
  if (error) return { error: "Código o clave incorrectos." };
  redirect("/mi-cuenta");
}

export async function salirCliente() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/mi-cuenta/ingresar");
}
