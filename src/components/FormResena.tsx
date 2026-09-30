"use client";

import { useActionState, useState } from "react";
import { dejarResena } from "@/app/resenas/actions";

export function FormResena({ trabajoId, token }: { trabajoId: string; token: string | null }) {
  const [estado, accion, pendiente] = useActionState(dejarResena.bind(null, trabajoId, token), undefined);
  const [puntaje, setPuntaje] = useState(0);
  if (estado && "ok" in estado) return <p className="text-sm">¡Gracias por tu opinión! Nos ayuda muchísimo.</p>;
  return (
    <form action={accion} className="space-y-3 border-t pt-4" style={{ borderColor: "var(--line)" }}>
      <h3 className="font-medium">¿Cómo te fue con el trabajo?</h3>
      <input type="hidden" name="puntaje" value={puntaje} />
      <div className="flex gap-1" role="radiogroup" aria-label="Puntaje">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={puntaje === n} aria-label={`${n} estrellas`}
            onClick={() => setPuntaje(n)} className="text-3xl leading-none" style={{ color: n <= puntaje ? "#f5b301" : "var(--line)" }}>★</button>
        ))}
      </div>
      <textarea name="comentario" rows={3} placeholder="Contanos cómo quedó tu instrumento (opcional)" className="w-full rounded-xl border p-3 text-sm" style={{ borderColor: "var(--line)", background: "var(--bg)" }} />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="autoriza" defaultChecked className="mt-1" />
        <span>Autorizo a publicar mi opinión en la web con mi nombre y la inicial del apellido.</span>
      </label>
      {estado && "error" in estado && <p className="text-sm text-red-600">{estado.error}</p>}
      <button className="btn" disabled={pendiente || puntaje === 0}>{pendiente ? "Enviando…" : "Enviar opinión"}</button>
    </form>
  );
}
