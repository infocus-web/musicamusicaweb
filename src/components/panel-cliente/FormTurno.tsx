"use client";
import { useActionState, useState } from "react";
import { pedirTurno } from "@/app/mi-cuenta/panel/actions";

export function FormTurno({ token }: { token: string | null }) {
  const [estado, accion, pendiente] = useActionState(pedirTurno.bind(null, token), undefined);
  const [hoy] = useState(() => new Date().toISOString().slice(0, 10));
  if (estado?.ok) return (
    <div className="card space-y-2">
      <p className="text-lg font-semibold">📅 ¡Pedido enviado!</p>
      <p className="muted text-sm">Te confirmamos el horario por el chat. Podés seguir la conversación en la pestaña Mensajes.</p>
    </div>
  );
  return (
    <form action={accion} className="card space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field"><span>¿Qué día te queda bien?</span><input type="date" name="fecha" min={hoy} required /></label>
        <label className="field"><span>Horario</span>
          <select name="franja" defaultValue="Por la tarde"><option>Por la mañana</option><option>Por la tarde</option><option>Me da igual</option></select>
        </label>
      </div>
      <fieldset className="space-y-1.5 text-sm">
        <legend className="muted mb-1">¿Cómo?</legend>
        {["Lo llevo al taller", "Que lo retiren por mi casa", "Lo mando por correo"].map((m, i) => (
          <label key={m} className="flex items-center gap-2"><input type="radio" name="modo" value={m} defaultChecked={i === 0} /> {m}</label>
        ))}
      </fieldset>
      <label className="field"><span>¿Qué necesitás? (opcional)</span><textarea name="motivo" rows={2} placeholder="Ej.: calibración, le zumba una cuerda…" /></label>
      {estado?.error && <p role="alert" className="text-sm text-red-600">{estado.error}</p>}
      <button className="btn w-full" disabled={pendiente}>{pendiente ? "Enviando…" : "Pedir turno"}</button>
    </form>
  );
}
