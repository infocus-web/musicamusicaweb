"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { InputClave } from "@/components/InputClave";

/** Cambia la clave del usuario logueado (personal o cliente). */
export function FormCambiarClave({ minimo = 6 }: { minimo?: number }) {
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [pendiente, setPendiente] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const clave = String(fd.get("clave") ?? "");
    if (clave.length < minimo) return setMsg({ error: `Mínimo ${minimo} caracteres.` });
    if (clave !== fd.get("repetir")) return setMsg({ error: "Las claves no coinciden." });
    setPendiente(true);
    const { error } = await createClient().auth.updateUser({ password: clave });
    setPendiente(false);
    if (error) return setMsg({ error: "No se pudo cambiar la clave. Probá con otra." });
    form.reset();
    setMsg({ ok: "¡Listo! Tu clave nueva ya funciona." });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <label className="field"><span>Clave nueva</span><InputClave name="clave" minLength={minimo} required autoComplete="new-password" /></label>
      <label className="field"><span>Repetir clave</span><InputClave name="repetir" minLength={minimo} required autoComplete="new-password" /></label>
      {msg?.error && <p className="text-sm text-red-600">{msg.error}</p>}
      {msg?.ok && <p className="text-sm text-emerald-600">{msg.ok}</p>}
      <button className="btn w-full" disabled={pendiente}>{pendiente ? "Guardando…" : "Cambiar clave"}</button>
    </form>
  );
}
