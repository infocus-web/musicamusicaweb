"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function ingresar(_prev: { error?: string } | undefined, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: "Email o contraseña incorrectos." };
  redirect("/taller");
}

export async function salir() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
