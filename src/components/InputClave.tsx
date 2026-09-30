"use client";

import { useState } from "react";

/** Campo de clave con el ojito para mostrarla u ocultarla. */
export function InputClave(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [ver, setVer] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={ver ? "text" : "password"} className={`w-full pr-12 ${props.className ?? ""}`} />
      <button
        type="button"
        onClick={() => setVer(!ver)}
        aria-label={ver ? "Ocultar clave" : "Mostrar clave"}
        title={ver ? "Ocultar clave" : "Mostrar clave"}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center muted hover:opacity-80"
      >
        {ver ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><path d="M1 1l22 22" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
