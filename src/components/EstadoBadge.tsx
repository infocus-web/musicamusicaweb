import { estadoInfo } from "@/lib/estados";

export function EstadoBadge({ estado }: { estado: string }) {
  const e = estadoInfo(estado);
  return <span className={`badge ${e.color}`}>{e.label}</span>;
}
