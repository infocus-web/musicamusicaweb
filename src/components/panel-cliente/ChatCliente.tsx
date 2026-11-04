"use client";
import { useCallback } from "react";
import { Chat } from "./Chat";
import { enviarMensaje, leerMensajes } from "@/app/mi-cuenta/panel/actions";

export function ChatCliente({ token, ordenes }: { token: string | null; ordenes: { id: string; nombre: string }[] }) {
  const leer = useCallback(() => leerMensajes(token), [token]);
  const enviar = useCallback((t: string, o: string | null) => enviarMensaje(token, t, o), [token]);
  return <Chat yo="cliente" leer={leer} enviar={enviar} ordenes={ordenes} vacio="Escribinos lo que necesites: dudas sobre tu instrumento, horarios, lo que sea. Te respondemos por acá." />;
}
