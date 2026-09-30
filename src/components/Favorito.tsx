"use client";

import { useEffect, useState } from "react";

const KEY = "mmw-favoritos";
const leer = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } };

/** Corazón para guardar un usado/producto como favorito (queda en este navegador). */
export function Favorito({ id }: { id: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(leer().includes(id)); }, [id]);
  return (
    <button
      type="button"
      aria-label={on ? "Quitar de favoritos" : "Guardar en favoritos"}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault(); e.stopPropagation();
        const l = leer(); const n = on ? l.filter((x) => x !== id) : [...l, id];
        try { localStorage.setItem(KEY, JSON.stringify(n)); } catch {}
        setOn(!on);
      }}
      className="grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 transition hover:scale-110"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={on ? "#d90000" : "none"} stroke={on ? "#d90000" : "currentColor"} strokeWidth="1.8" aria-hidden>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  );
}
