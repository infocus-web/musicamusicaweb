"use client";

import Link from "next/link";
import { use, useActionState } from "react";
import { ingresarCliente } from "../actions";
import { Logo } from "@/components/Logo";
import { InputClave } from "@/components/InputClave";

export default function IngresarClientePage({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const { volver } = use(searchParams);
  const [estado, accion, pendiente] = useActionState(ingresarCliente, undefined);
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <form action={accion} className="card w-full max-w-sm space-y-4">
        {volver && <input type="hidden" name="volver" value={volver} />}
        <div className="space-y-3">
          <Logo alto={72} prioridad />
          <h1 className="text-2xl font-semibold">Mi cuenta</h1>
          <p className="muted text-sm">Entrá con tu teléfono o email y tu clave.</p>
        </div>
        <label className="field">
          <span>Teléfono o email</span>
          <input name="usuario" placeholder="11 2345 6789" required autoComplete="username" />
        </label>
        <label className="field">
          <span>Clave</span>
          <InputClave name="clave" required autoComplete="current-password" />
        </label>
        {estado?.error && <p className="text-sm text-red-600">{estado.error}</p>}
        <button className="btn w-full" disabled={pendiente}>{pendiente ? "Ingresando…" : "Ingresar"}</button>
        <p className="muted text-xs">¿No tenés cuenta? <Link href={volver ? `/registro?volver=${encodeURIComponent(volver)}` : "/registro"} className="link">Registrate</Link>. ¿No tenés clave? Abrí el link que te mandamos por WhatsApp y creala desde “Mi cuenta”. <Link href="/" className="link">Volver al inicio</Link></p>
      </form>
    </main>
  );
}
