import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAjustes } from "@/lib/ajustes";
import { mpActivo } from "@/lib/mercadopago";
import { SiteHeader } from "@/components/SiteHeader";
import { Checkout } from "./Checkout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Finalizar compra — Música Música Web", robots: { index: false } };

export default async function CheckoutPage() {
  const [{ data: envios }, a] = await Promise.all([
    createAdminClient().from("envios").select("*").eq("activo", true).order("orden"),
    obtenerAjustes(),
  ]);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <h1 className="titulo text-4xl">Finalizar compra</h1>
        <Checkout envios={envios ?? []} mp={mpActivo()} descuentoTransferencia={Number(a.transferencia_descuento ?? 0) || 0} />
      </main>
    </>
  );
}
