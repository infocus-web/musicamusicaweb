"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ingresarCliente } from "../actions";
import { Logo } from "@/components/Logo";
import { InputClave } from "@/components/InputClave";

export default function IngresarClientePage() {
  const [estado, accion, pendiente] = useActionState(ingresarCliente, undefined);
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <form action={accion} className="card w-full max-w-sm space-y-4">
        <div className="space-y-3">
          <Logo alto={72} prioridad />
          <h1 className="text-2xl font-semibold">Mi cuenta</h1>
          <p className="muted text-sm">Entrá con el código de cliente y la clave que te dio el taller.</p>
        </div>
        <label className="field">
          <span>Código de cliente</span>
          <input name="codigo" placeholder="MM-0001" required autoCapitalize="characters" autoComplete="username" className="font-mono uppercase" />
        </label>
        <label className="field">
          <span>Clave</span>
          <InputClave name="clave" required autoComplete="current-password" />
        </label>
        {estado?.error && <p className="text-sm text-red-600">{estado.error}</p>}
        <button className="btn w-full" disabled={pendiente}>{pendiente ? "Ingresando…" : "Ingresar"}</button>
        <p className="muted text-xs">¿No tenés clave? Pedísela al taller por WhatsApp. <Link href="/" className="link">Volver al inicio</Link></p>
      </form>
    </main>
  );
}
