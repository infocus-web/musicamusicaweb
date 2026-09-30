import { FormCambiarClave } from "@/components/FormCambiarClave";

export default function MiClavePage() {
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Cambiar mi clave</h1>
      <FormCambiarClave minimo={8} />
    </div>
  );
}
