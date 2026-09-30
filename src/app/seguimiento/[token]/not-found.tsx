export default function NoEncontrado() {
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="card max-w-sm text-center space-y-2">
        <h1 className="text-xl font-semibold">Link no válido</h1>
        <p className="muted text-sm">Este link de seguimiento no existe o fue reemplazado. Pedile uno nuevo al taller.</p>
      </div>
    </main>
  );
}
