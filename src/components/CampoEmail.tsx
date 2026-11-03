"use client";

import { useState } from "react";
import { sugerirEmail } from "@/lib/email";

/**
 * Campo de email que avisa si el dominio parece mal escrito (gmmail.com → gmail.com).
 * Si la persona confirma que está bien, manda email_ok=1 para que el servidor no lo vuelva a frenar.
 */
export function CampoEmail({ label = "Email", defaultValue = "", required = false, autoComplete = "email" }: {
  label?: string; defaultValue?: string; required?: boolean; autoComplete?: string;
}) {
  const [valor, setValor] = useState(defaultValue);
  const [aceptado, setAceptado] = useState<string | null>(null);
  const [revisar, setRevisar] = useState(false);
  const sugerencia = revisar && valor && aceptado !== valor ? sugerirEmail(valor) : null;

  return (
    <div className="space-y-1.5">
      <label className="field">
        <span>{label}{required ? " *" : ""}</span>
        <input name="email" type="email" value={valor} required={required} autoComplete={autoComplete}
          onChange={(e) => { setValor(e.target.value); setRevisar(false); }}
          onBlur={() => setRevisar(true)} aria-describedby={sugerencia ? "email-sugerencia" : undefined} />
      </label>
      <input type="hidden" name="email_ok" value={aceptado && aceptado === valor ? "1" : ""} />
      {sugerencia && (
        <div id="email-sugerencia" role="status" className="rounded-lg p-2.5 text-sm" style={{ background: "#fef3c7", color: "#78350f" }}>
          ¿Quisiste decir <b>{sugerencia}</b>?
          <span className="mt-1.5 flex flex-wrap gap-2">
            <button type="button" className="rounded-md bg-amber-700 px-2.5 py-1 font-medium text-white" onClick={() => setValor(sugerencia)}>Sí, corregir</button>
            <button type="button" className="rounded-md border border-amber-700 px-2.5 py-1" onClick={() => setAceptado(valor)}>No, está bien así</button>
          </span>
        </div>
      )}
    </div>
  );
}
