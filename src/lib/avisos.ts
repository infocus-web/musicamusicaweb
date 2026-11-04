import { estadoInfo, formatoPesos, linkSeguimiento } from "@/lib/estados";

export type AvisoFila = { id: string; tipo: string; dato: string | null; creado_en: string; trabajo: { numero: string; instrumento: string } | null };

const fechaLarga = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }).replace(",", "");

/** Una línea por aviso, en el idioma del cliente. */
export function lineaAviso(a: AvisoFila) {
  const inst = a.trabajo ? `tu ${a.trabajo.instrumento} (orden ${a.trabajo.numero})` : "tu instrumento";
  const Inst = inst[0].toUpperCase() + inst.slice(1);
  switch (a.tipo) {
    case "estado":
      if (a.dato === "listo") return `✅ ${Inst} *ya se puede retirar*.`;
      if (a.dato === "entregado") return `🎸 ¡Gracias por retirar ${inst}! Si querés, dejanos tu opinión en tu panel.`;
      return `🔧 ${Inst}: *${estadoInfo(a.dato ?? "").label}*.`;
    case "fotos": return `📸 Subimos fotos/videos nuevos de ${inst}.`;
    case "aprobacion": return `📋 Necesitamos que apruebes ${a.dato ? `${formatoPesos(Number(a.dato))} ` : ""}del presupuesto de ${inst}.`;
    case "turno": {
      const [fecha, hora] = (a.dato ?? "").split(" ");
      return `📅 Tu turno quedó confirmado para el *${fecha ? fechaLarga(fecha) : ""}${hora ? ` a las ${hora}` : ""}*.`;
    }
    default: return a.dato ?? "";
  }
}

/** Mensaje de WhatsApp que junta todos los avisos pendientes de un cliente. */
export function mensajeAvisos(nombre: string, token: string, avisos: AvisoFila[]) {
  const lineas = avisos.map(lineaAviso).filter(Boolean);
  return `Hola ${nombre.split(" ")[0]}! Te escribimos de Música Música Web.\n\n${lineas.join("\n")}\n\nTodo el detalle, fotos y videos en tu panel: ${linkSeguimiento(token)}`;
}
