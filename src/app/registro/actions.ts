"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { claveTelefono } from "@/lib/csv";
import { emailCliente } from "@/lib/auth";
import { linkSeguimiento } from "@/lib/estados";

export type EstadoRegistro =
  | undefined
  | { error: string }
  | { ok: true; nuevo: true; nombre: string; codigo: string; link: string; conClave: boolean }
  | { ok: true; nuevo: false; nombre: string };

const corto = (v: FormDataEntryValue | null, max = 200) => {
  const s = String(v ?? "").trim().slice(0, max);
  return s === "" ? null : s;
};

export async function registrarCliente(_prev: EstadoRegistro, fd: FormData): Promise<EstadoRegistro> {
  // Anti-spam: campo trampa invisible y un mínimo de tiempo completando el formulario.
  if (corto(fd.get("sitio_web"))) return { error: "No se pudo enviar." };
  const t = Number(fd.get("t"));
  if (!t || Date.now() - t < 3000) return { error: "Revisá los datos y volvé a enviar." };

  const nombre = corto(fd.get("nombre"), 120);
  const telefono = corto(fd.get("telefono"), 40);
  const email = corto(fd.get("email"), 160)?.toLowerCase() ?? null;
  const clave = String(fd.get("clave") ?? "");
  if (!nombre || nombre.length < 3) return { error: "Escribí tu nombre y apellido." };
  const tel = claveTelefono(telefono);
  if (!tel) return { error: "Escribí un teléfono válido, con código de área." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "El email no parece válido." };
  if (clave && clave.length < 6) return { error: "La clave tiene que tener al menos 6 caracteres." };
  if (fd.get("acepto") !== "on") return { error: "Necesitamos tu conformidad para guardar tus datos." };

  const db = createAdminClient();

  // Si ya está registrado no creamos otro ni mostramos sus datos (podría ser otra persona).
  const { data: existente } = await db.from("clientes").select("id").eq("telefono_norm", tel).limit(1).maybeSingle();
  if (existente) return { ok: true, nuevo: false, nombre: nombre.split(" ")[0] };

  const { data: c, error } = await db
    .from("clientes")
    .insert({ nombre, telefono, email, notas: corto(fd.get("notas"), 1000), origen: "registro", revisado: false })
    .select("id, codigo, token")
    .single();
  if (error || !c) return { error: "No pudimos guardar tus datos. Probá de nuevo en un rato." };

  const tipo = corto(fd.get("tipo"), 80);
  const marca = corto(fd.get("marca"), 80);
  const modelo = corto(fd.get("modelo"), 80);
  const serie = corto(fd.get("numero_serie"), 80);
  if (tipo || marca || modelo || serie) {
    await db.from("instrumentos").insert({ cliente_id: c.id, tipo: tipo ?? "Otro", marca, modelo, numero_serie: serie });
  }

  let conClave = false;
  if (clave) {
    const { data: u } = await db.auth.admin.createUser({
      email: emailCliente(c.codigo),
      password: clave,
      email_confirm: true,
      user_metadata: { tipo: "cliente", codigo: c.codigo, nombre },
    });
    if (u?.user) {
      await db.from("clientes").update({ user_id: u.user.id }).eq("id", c.id);
      conClave = true;
    }
  }

  return { ok: true, nuevo: true, nombre: nombre.split(" ")[0], codigo: c.codigo, link: linkSeguimiento(c.token), conClave };
}
