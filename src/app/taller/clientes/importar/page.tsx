import Link from "next/link";
import { Importador } from "./Importador";

export default function ImportarClientesPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/taller/clientes" className="muted text-sm hover:underline">← Clientes</Link>
        <h1 className="text-2xl font-semibold">Importar clientes desde CSV</h1>
        <p className="muted text-sm">Cada cliente recibe su código MM-xxxx y su link privado automáticamente.</p>
      </div>
      <Importador />
    </div>
  );
}
