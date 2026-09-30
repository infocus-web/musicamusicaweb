import { NextResponse, type NextRequest } from "next/server";
import { obtenerPago } from "@/lib/mercadopago";
import { aplicarPagoMP } from "@/lib/pedidos";

/**
 * Aviso de Mercado Pago. No confiamos en lo que llega: con el id consultamos el pago
 * directo a la API de MP (con nuestro token) y recién ahí lo aplicamos.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  let id = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  let tipo = url.searchParams.get("type") ?? url.searchParams.get("topic");
  try {
    const body = await req.json();
    id = id ?? body?.data?.id ?? null;
    tipo = tipo ?? body?.type ?? body?.topic ?? null;
  } catch {}
  if (tipo === "payment" && id) {
    const pago = await obtenerPago(String(id));
    if (pago) await aplicarPagoMP(pago);
  }
  return NextResponse.json({ ok: true });
}

export const GET = POST;
