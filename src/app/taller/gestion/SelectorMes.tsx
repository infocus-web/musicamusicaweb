import Link from "next/link";

export function SelectorMes({ base, mes, etiqueta, anterior, siguiente }: { base: string; mes: string; etiqueta: string; anterior: string; siguiente: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link href={`${base}?mes=${anterior}`} className="btn-ghost !px-3 !py-1.5" aria-label="Mes anterior">←</Link>
      <span className="min-w-36 text-center font-semibold capitalize">{etiqueta}</span>
      <Link href={`${base}?mes=${siguiente}`} className="btn-ghost !px-3 !py-1.5" aria-label="Mes siguiente">→</Link>
      <input type="hidden" value={mes} readOnly />
    </div>
  );
}
