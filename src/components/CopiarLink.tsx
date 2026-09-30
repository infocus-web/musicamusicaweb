"use client";

import { useState } from "react";

export function CopiarLink({ url }: { url: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      {ok ? "¡Copiado!" : "Copiar link"}
    </button>
  );
}
