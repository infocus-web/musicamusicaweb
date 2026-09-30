/** Ícono de línea para categorías sin foto todavía. */
export function IconoCategoria({ cat, className = "h-1/2 w-1/2" }: { cat: string; className?: string }) {
  const p = { viewBox: "0 0 48 48", className, fill: "none", stroke: "var(--accent)", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (cat) {
    case "cuerdas": return <svg {...p}><circle cx="24" cy="24" r="16" /><circle cx="24" cy="24" r="11" /><circle cx="24" cy="24" r="6" /><path d="M24 8v-4" /></svg>;
    case "accesorios": return <svg {...p}><path d="M24 42c-8-6-14-14-14-22a14 14 0 0 1 28 0c0 8-6 16-14 22z" /></svg>;
    case "repuestos": return <svg {...p}><circle cx="16" cy="24" r="6" /><circle cx="32" cy="24" r="6" /><path d="M16 18V8M32 18V8M16 30v10M32 30v10" /></svg>;
    case "pedales": return <svg {...p}><rect x="12" y="6" width="24" height="36" rx="3" /><circle cx="24" cy="30" r="5" /><circle cx="18" cy="13" r="2" /><circle cx="30" cy="13" r="2" /></svg>;
    case "_usados": case "guitarras": case "bajos": return <svg {...p}><path d="M38 4l6 6-12 12" /><path d="M24 20a8 8 0 0 0-10.6 1.2 6 6 0 0 0-2.8 6.8L4 34.6 13.4 44l5.6-5.6a6 6 0 0 0 6.8-2.8A8 8 0 0 0 27 25z" /><circle cx="18" cy="30" r="2" /></svg>;
    case "servicios": return <svg {...p}><path d="M29 12a8 8 0 0 0-10.8 10.8L6 35l7 7 12.2-12.2A8 8 0 0 0 36 19l-5 5-5-1-1-5z" /></svg>;
    case "cuidado": return <svg {...p}><rect x="16" y="16" width="16" height="26" rx="3" /><path d="M20 16v-6h8v6M28 10h8M32 6v8" /></svg>;
    case "cables": return <svg {...p}><path d="M8 40c10 0 10-16 20-16s10-16 12-16" /><rect x="36" y="4" width="8" height="10" rx="2" /><rect x="4" y="36" width="8" height="8" rx="2" /></svg>;
    case "amplificadores": return <svg {...p}><rect x="6" y="8" width="36" height="32" rx="3" /><circle cx="24" cy="26" r="9" /><path d="M12 14h.01M18 14h.01" /></svg>;
    case "teclados": return <svg {...p}><rect x="4" y="12" width="40" height="24" rx="3" /><path d="M14 12v14M24 12v14M34 12v14" /></svg>;
    case "bateria": return <svg {...p}><ellipse cx="24" cy="18" rx="16" ry="6" /><path d="M8 18v12c0 3.3 7.2 6 16 6s16-2.7 16-6V18M10 6l10 10M38 6L28 16" /></svg>;
    default: return <svg {...p}><path d="M18 6v26a6 6 0 1 1-4-5.6V10l20-4v20a6 6 0 1 1-4-5.6V6" /></svg>;
  }
}
