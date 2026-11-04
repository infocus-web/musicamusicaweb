import { redirect } from "next/navigation";
import { obtenerStaff } from "@/lib/auth";
import { SubNav } from "./SubNav";

/** Gestión (ventas, stock, compras, costos): solo administradores. */
export default async function GestionLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await obtenerStaff();
  if (staff?.rol !== "admin") redirect("/taller");
  return (
    <div className="space-y-5">
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold">Gestión</h1>
        <p className="muted text-sm">Ventas, cobros, stock, compras y comprobantes. Solo lo ven los administradores.</p>
      </div>
      <SubNav />
      {children}
    </div>
  );
}
