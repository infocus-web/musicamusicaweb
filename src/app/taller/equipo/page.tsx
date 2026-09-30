import { redirect } from "next/navigation";
import { obtenerStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { FormNuevo } from "./FormNuevo";
import { FilaIntegrante } from "./FilaIntegrante";

export default async function EquipoPage() {
  const { user, staff } = await obtenerStaff();
  if (!user || staff?.rol !== "admin") redirect("/taller");

  const { data: equipo } = await createAdminClient()
    .from("staff")
    .select("user_id, nombre, email, rol, creado_en")
    .order("creado_en");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Equipo del taller</h1>
          <p className="muted text-sm">Cada persona entra en /login con su email y su clave.</p>
        </div>
        <ul className="space-y-3">
          {(equipo ?? []).map((m) => (
            <FilaIntegrante key={m.user_id} userId={m.user_id} nombre={m.nombre} email={m.email} rol={m.rol} esYo={m.user_id === user.id} />
          ))}
        </ul>
      </section>
      <aside><FormNuevo /></aside>
    </div>
  );
}
