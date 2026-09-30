import Image from "next/image";
import logo from "../../public/logo.png";

/** Logo Música Música Web (public/logo.png). */
export function Logo({ alto = 40, prioridad = false }: { alto?: number; prioridad?: boolean }) {
  const ancho = Math.round((logo.width / logo.height) * alto);
  return (
    <Image src={logo} alt="Música Música Web" width={ancho} height={alto} priority={prioridad} className="h-auto" style={{ height: alto, width: ancho }} />
  );
}
