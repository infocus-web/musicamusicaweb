"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerAjustes } from "@/lib/ajustes";
import { crearPreferencia, mpActivo } from "@/lib/mercadopago";
import { claveTelefono } from "@/lib/csv";

type ItemEntrada = { tipo: "producto" | "usado"; id: string; varianteId?: string | null; cantidad: number };
export type ResultadoPedido = { error: string } | { redirigir: string };

export async function crearPedido(itemsIn: ItemEntrada[], fd: FormData): Promise<ResultadoPedido> {
  const s = (k: string, max = 200) => { const v = String(fd.get(k) ?? "").trim().slice(0, max); return v || null; };
  if (s("sitio_web")) return { error: "No se pudo procesar." };
  const nombre = s("nombre", 120), telefono = s("telefono", 40), email = s("email", 160);
  if (!nombre) return { error: "Escribí tu nombre." };
  if (!claveTelefono(telefono)) return { error: "Escribí un teléfono válido, con código de área." };
  if (!Array.isArray(itemsIn) || itemsIn.length === 0 || itemsIn.length > 50) return { error: "El carrito está vacío." };

  const db = createAdminClient();
  const ajustes = await obtenerAjustes();

  // 1) Validar ítems contra la base (precio y stock reales)
  type Linea = { producto_id: string | null; variante_id: string | null; usado_id: string | null; nombre: string; precio: number; cantidad: number };
  const lineas: Linea[] = [];
  for (const it of itemsIn) {
    const cantidad = Math.max(1, Math.min(99, Math.floor(Number(it.cantidad) || 1)));
    if (it.tipo === "usado") {
      const { data: u } = await db.from("usados").select("id, titulo, precio, moneda, estado, venta_online").eq("id", it.id).maybeSingle();
      if (!u || u.estado !== "publicado" || !u.venta_online || u.moneda !== "ARS" || !u.precio) return { error: `"${u?.titulo ?? "Un usado"}" ya no está disponible para comprar online.` };
      lineas.push({ producto_id: null, variante_id: null, usado_id: u.id, nombre: `${u.titulo} (usado)`, precio: Number(u.precio), cantidad: 1 });
    } else {
      const { data: p } = await db.from("productos").select("id, nombre, precio, activo, variantes(id, nombre, precio)").eq("id", it.id).maybeSingle();
      if (!p || !p.activo) return { error: "Un producto del carrito ya no está disponible." };
      const v = it.varianteId ? (p.variantes as { id: string; nombre: string; precio: number | null }[]).find((x) => x.id === it.varianteId) : null;
      if (it.varianteId && !v) return { error: `La opción elegida de "${p.nombre}" ya no existe.` };
      lineas.push({ producto_id: p.id, variante_id: v?.id ?? null, usado_id: null, nombre: v ? `${p.nombre} — ${v.nombre}` : p.nombre, precio: Number(v?.precio ?? p.precio), cantidad });
    }
  }
  const subtotal = lineas.reduce((a, l) => a + l.precio * l.cantidad, 0);

  // 2) Envío
  const { data: envio } = await db.from("envios").select("*").eq("id", s("envio_id", 40) ?? "").eq("activo", true).maybeSingle();
  if (!envio) return { error: "Elegí cómo recibir tu pedido." };
  const direccion = s("direccion"), localidad = s("localidad", 100), provincia = s("provincia", 60), cp = s("codigo_postal", 12);
  if (["fijo", "correo", "moto"].includes(envio.tipo) && (!direccion || !localidad)) return { error: "Completá la dirección de entrega." };
  if (envio.tipo === "correo" && (!provincia || !cp)) return { error: "Para envío por correo necesitamos provincia y código postal." };
  const envioCosto = envio.tipo === "fijo" ? (envio.gratis_desde && subtotal >= Number(envio.gratis_desde) ? 0 : Number(envio.precio)) : envio.tipo === "retiro" ? 0 : null;

  // 3) Pago
  const metodo = String(fd.get("pago"));
  if (!["mercadopago", "transferencia", "efectivo"].includes(metodo)) return { error: "Elegí cómo pagar." };
  if (metodo === "mercadopago" && !mpActivo()) return { error: "Mercado Pago todavía no está disponible. Elegí otra forma de pago." };
  if (metodo === "efectivo" && envio.tipo !== "retiro") return { error: "El pago en efectivo es solo retirando en el local." };
  const pctTransf = Math.max(0, Math.min(30, Number(ajustes.transferencia_descuento ?? 0) || 0));
  const descuento = metodo === "transferencia" ? Math.round((subtotal * pctTransf) / 100) : 0;
  const total = subtotal - descuento + (envioCosto ?? 0);
  const aCotizar = envio.tipo === "correo";

  // 4) Crear pedido
  const { data: pedido, error } = await db.from("pedidos").insert({
    nombre, telefono, email, dni: s("dni", 20),
    envio_id: envio.id, envio_nombre: envio.nombre, envio_tipo: envio.tipo, envio_costo: envioCosto,
    direccion, localidad, provincia, codigo_postal: cp,
    pago_metodo: metodo, subtotal, descuento, total,
    estado: aCotizar ? "a_cotizar" : "pendiente",
    notas: s("notas", 1000),
  }).select("id, numero, token, total").single();
  if (error || !pedido) return { error: "No pudimos crear el pedido. Probá de nuevo." };
  await db.from("pedido_items").insert(lineas.map((l) => ({ ...l, pedido_id: pedido.id })));

  // 5) Reservar stock / usados. Si algo no alcanza, se deshace lo reservado y se borra el pedido.
  const reservadas: Linea[] = [];
  for (const l of lineas) {
    let ok: boolean;
    if (l.usado_id) {
      const { data } = await db.from("usados").update({ estado: "reservado" }).eq("id", l.usado_id).eq("estado", "publicado").select("id");
      ok = !!data?.length;
    } else {
      const { data } = await db.rpc("descontar_stock", { p_producto: l.producto_id, p_variante: l.variante_id, p_cantidad: l.cantidad });
      ok = data === true;
    }
    if (!ok) {
      for (const r of reservadas) {
        if (r.usado_id) await db.from("usados").update({ estado: "publicado" }).eq("id", r.usado_id).eq("estado", "reservado");
        else await db.rpc("devolver_stock", { p_producto: r.producto_id, p_variante: r.variante_id, p_cantidad: r.cantidad });
      }
      await db.from("pedidos").delete().eq("id", pedido.id);
      return { error: `No hay stock suficiente de "${l.nombre}". Revisá el carrito.` };
    }
    reservadas.push(l);
  }

  // 6) Mercado Pago (si no hay que cotizar envío)
  if (metodo === "mercadopago" && !aCotizar) {
    try {
      const pref = await crearPreferencia({ ...pedido, email, nombre });
      await db.from("pedidos").update({ mp_preference_id: pref.id }).eq("id", pedido.id);
      return { redirigir: pref.url };
    } catch {
      return { redirigir: `/pedido/${pedido.token}?mp=error` };
    }
  }
  return { redirigir: `/pedido/${pedido.token}?nuevo=1` };
}
