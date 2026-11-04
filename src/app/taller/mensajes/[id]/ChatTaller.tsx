"use client";
import { useCallback } from "react";
import { Chat } from "@/components/panel-cliente/Chat";
import { leerChatTaller, responderTaller } from "../actions";

export function ChatTaller({ clienteId, ordenes, rapidas }: { clienteId: string; ordenes: { id: string; nombre: string }[]; rapidas: string[] }) {
  const leer = useCallback(() => leerChatTaller(clienteId), [clienteId]);
  const enviar = useCallback((t: string, o: string | null) => responderTaller(clienteId, t, o), [clienteId]);
  return <Chat yo="taller" leer={leer} enviar={enviar} ordenes={ordenes} rapidas={rapidas} alto="h-[55vh]" vacio="Todavía no hay mensajes. Escribile y lo ve en su panel." />;
}
