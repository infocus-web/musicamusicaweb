import { estadoInfo } from "@/lib/estados";

export function EstadoBadge({ estado }: { estado: string }) {
  const e = estadoInfo(estado);
  return <span className={`badge shrink-0 whitespace-nowrap ${e.color}`}>{e.label}</span>;
}
