"use client";

import { useState } from "react";

export function Compartir({ titulo, url }: { titulo: string; url: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={async () => {
        if (navigator.share) {
          try { await navigator.share({ title: titulo, url }); } catch {}
        } else {
          await navigator.clipboard.writeText(url);
          setOk(true); setTimeout(() => setOk(false), 1500);
        }
      }}
    >
      {ok ? "¡Link copiado!" : "Compartir"}
    </button>
  );
}
