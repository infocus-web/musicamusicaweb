import "server-only";
import { siteUrl } from "@/lib/estados";

const API = "https://api.mercadopago.com";
const token = () => process.env.MP_ACCESS_TOKEN;
export const mpActivo = () => !!token();

type PedidoMP = { id: string; numero: string; token: string; total: number; email: string | null; nombre: string };

/** Crea la preferencia de Checkout Pro y devuelve el link de pago. */
export async function crearPreferencia(p: PedidoMP) {
  if (!token()) throw new Error("Mercado Pago no está configurado.");
  const base = siteUrl();
  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", "X-Idempotency-Key": `pref-${p.id}-${p.total}` },
    body: JSON.stringify({
      items: [{ id: p.numero, title: `Pedido ${p.numero} — Música Música Web`, quantity: 1, unit_price: Number(p.total), currency_id: "ARS" }],
      payer: p.email ? { email: p.email, name: p.nombre } : { name: p.nombre },
      external_reference: p.id,
      back_urls: { success: `${base}/pedido/${p.token}?mp=ok`, pending: `${base}/pedido/${p.token}?mp=pendiente`, failure: `${base}/pedido/${p.token}?mp=error` },
      auto_return: "approved",
      notification_url: `${base}/api/mercadopago`,
      statement_descriptor: "MUSICAMUSICA",
    }),
  });
  if (!res.ok) throw new Error(`Mercado Pago: ${res.status} ${await res.text()}`);
  const j = await res.json();
  return { id: j.id as string, url: j.init_point as string };
}

export type PagoMP = { id: string; status: string; external_reference: string | null; transaction_amount: number };

export async function obtenerPago(id: string): Promise<PagoMP | null> {
  if (!token()) return null;
  const res = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token()}` }, cache: "no-store" });
  if (!res.ok) return null;
  const j = await res.json();
  return { id: String(j.id), status: j.status, external_reference: j.external_reference ?? null, transaction_amount: Number(j.transaction_amount) };
}

/** Último pago de un pedido (por si el aviso de MP todavía no llegó). */
export async function buscarPagoDePedido(pedidoId: string): Promise<PagoMP | null> {
  if (!token()) return null;
  const res = await fetch(`${API}/v1/payments/search?external_reference=${encodeURIComponent(pedidoId)}&sort=date_created&criteria=desc&limit=5`, {
    headers: { Authorization: `Bearer ${token()}` }, cache: "no-store",
  });
  if (!res.ok) return null;
  const j = await res.json();
  const r = (j.results ?? []) as { id: number; status: string; external_reference: string; transaction_amount: number }[];
  const aprobado = r.find((x) => x.status === "approved") ?? r[0];
  return aprobado ? { id: String(aprobado.id), status: aprobado.status, external_reference: aprobado.external_reference, transaction_amount: Number(aprobado.transaction_amount) } : null;
}
