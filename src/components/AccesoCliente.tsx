"use client";

import { useActionState } from "react";
import { bloquearAccesoCliente, generarClaveCliente } from "@/app/taller/actions";

type Props = {
  clienteId: string;
  codigo: string;
  nombre: string;
  telefono: string | null;
  tieneAcceso: boolean;
  urlCuenta: string;
};

export function AccesoCliente({ clienteId, codigo, nombre, telefono, tieneAcceso, urlCuenta }: Props) {
  const [estado, accion, pendiente] = useActionState(generarClaveCliente.bind(null, clienteId), undefined);

  const mensaje = estado?.clave
    ? `Hola ${nombre}! Ya podés entrar a tu cuenta de Música Música Web para seguir tus instrumentos.\n\nEntrá en: ${urlCuenta}\nCódigo: ${codigo}\nClave: ${estado.clave}\n\nDespués podés cambiar la clave desde tu cuenta.`
    : "";
  let num = (telefono ?? "").replace(/\D/g, "");
  if (num && !num.startsWith("54")) num = "549" + num.replace(/^0/, "");
  const wa = `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`;

  return (
    <section className="card space-y-3">
      <h2 className="font-semibold">Acceso del cliente con clave</h2>
      <p className="muted text-sm">
        El cliente entra en <span className="font-mono">{urlCuenta.replace(/^https?:\/\//, "")}</span> con su código <b className="font-mono">{codigo}</b> y una clave.
        {tieneAcceso ? " Ya tiene clave creada." : " Todavía no tiene clave."}
      </p>

      {estado?.clave && (
        <div className="space-y-2 rounded-xl p-3" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
          <p className="text-sm">Clave nueva (anotala o mandala ahora, no se vuelve a mostrar):</p>
          <p className="font-mono text-2xl tracking-widest">{estado.clave}</p>
          <a className="btn" href={wa} target="_blank" rel="noreferrer">Mandar código y clave por WhatsApp</a>
        </div>
      )}
      {estado?.error && <p className="text-sm text-red-600">{estado.error}</p>}

      <div className="flex flex-wrap gap-2">
        <form action={accion}>
          <button className={tieneAcceso ? "btn-ghost" : "btn"} disabled={pendiente}>
            {pendiente ? "Generando…" : tieneAcceso ? "Generar clave nueva" : "Crear clave"}
          </button>
        </form>
        {tieneAcceso && (
          <button
            type="button"
            className="btn-ghost text-red-600"
            onClick={async () => {
              if (confirm("¿Quitarle el acceso con clave? El link privado sigue funcionando.")) await bloquearAccesoCliente(clienteId);
            }}
          >
            Quitar acceso con clave
          </button>
        )}
      </div>
    </section>
  );
}
