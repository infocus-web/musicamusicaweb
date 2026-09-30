"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { crearAvance } from "@/app/taller/actions";

export function SubirAvance({ trabajoId }: { trabajoId: string }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const archivo = fd.get("archivo") as File | null;
    const descripcion = String(fd.get("descripcion") ?? "").trim() || null;
    const visibleCliente = fd.get("visible") === "on";
    if (!descripcion && (!archivo || archivo.size === 0)) {
      setEstado("Escribí una nota o elegí un archivo.");
      return;
    }
    setEnviando(true);
    try {
      let mediaPath: string | null = null;
      let mediaTipo: "video" | "foto" | null = null;
      if (archivo && archivo.size > 0) {
        setEstado("Subiendo archivo…");
        const ext = archivo.name.split(".").pop()?.toLowerCase() || "bin";
        mediaPath = `${trabajoId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
        mediaTipo = archivo.type.startsWith("video") ? "video" : "foto";
        const { error } = await createClient().storage.from("avances").upload(mediaPath, archivo, {
          contentType: archivo.type || undefined,
          upsert: false,
        });
        if (error) throw new Error(error.message);
      }
      setEstado("Guardando…");
      await crearAvance({ trabajoId, descripcion, mediaPath, mediaTipo, visibleCliente });
      form.current?.reset();
      setEstado("¡Avance publicado!");
      router.refresh();
    } catch (err) {
      setEstado("No se pudo subir: " + (err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form ref={form} onSubmit={onSubmit} className="card space-y-3">
      <h2 className="font-semibold">Agregar avance</h2>
      <label className="field"><span>Nota para el cliente</span>
        <textarea name="descripcion" rows={2} placeholder="Ej.: prueba de funcionamiento, ajuste de alma terminado…" />
      </label>
      <label className="field"><span>Video o foto</span>
        <input name="archivo" type="file" accept="video/*,image/*" capture="environment" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="visible" defaultChecked /> Visible para el cliente
      </label>
      <button className="btn w-full" disabled={enviando}>{enviando ? "Subiendo…" : "Publicar avance"}</button>
      {estado && <p className="muted text-sm">{estado}</p>}
    </form>
  );
}
