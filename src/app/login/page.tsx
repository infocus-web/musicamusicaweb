"use client";

import { useActionState } from "react";
import { ingresar } from "./actions";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [state, action, pending] = useActionState(ingresar, undefined);
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <form action={action} className="card w-full max-w-sm space-y-4">
        <div className="space-y-3">
          <Logo alto={72} prioridad />
          <h1 className="text-2xl font-semibold">Ingreso del taller</h1>
        </div>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button className="btn w-full" disabled={pending}>
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
