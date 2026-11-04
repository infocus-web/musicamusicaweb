"use client";

import { useState, useTransition } from "react";
import { registrarCompra } from "./actions";

type Opcion = { valor: string; label: string; costo: number | null };
type Fila = { item: string; cantidad: string; costo: string };
const vacia = (): Fila => ({ item: "", cantidad: "1", costo: "" });
const n = (s: string) => Number(String(s).replace(/\./g, "").replace(",", "."));
const pesos = (x: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(x);

export function NuevaCompra({ proveedores, opciones }: { proveedores: { id: string; nombre: string }[]; opciones: Opcion[] }) {
  const [filas, setFilas] = useState<Fila[]>([vacia()]);
  const [prov, setProv] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }));
  const [comp, setComp] = useState("");
  const [notas, setNotas] = useState("");
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pendiente, start] = useTransition();
  const total = filas.reduce((a, f) => a + (n(f.cantidad) || 0) * (n(f.costo) || 0), 0);
  const cambiar = (i: number, c: Partial<Fila>) => setFilas((fs) => fs.map((f, j) => (j === i ? { ...f, ...c } : f)));
  const campo = "rounded-lg border px-2 py-2 text-sm";
  const est = { borderColor: "var(--line)", background: "var(--bg)", color: "var(--fg)" };

  function guardar() {
    setMsg(null);
    start(async () => {
      const r = await registrarCompra({
        proveedor: prov || null, fecha, comprobante: comp, notas,
        items: filas.filter((f) => f.item).map((f) => { const [p, v] = f.item.split("|"); return { producto_id: p, variante_id: v || null, cantidad: Math.round(n(f.cantidad)), costo: n(f.costo) }; }),
      });
      setMsg(r);
      if (r.ok) { setFilas([vacia()]); setComp(""); setNotas(""); }
    });
  }

  return (
    <section className="card space-y-3">
      <h2 className="font-semibold">Cargar compra</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="field"><span>Proveedor</span>
          <select value={prov} onChange={(e) => setProv(e.target.value)}><option value="">Sin proveedor</option>{proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
        </label>
        <label className="field"><span>Fecha</span><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
        <label className="field"><span>N° factura / remito</span><input value={comp} onChange={(e) => setComp(e.target.value)} /></label>
      </div>
      <div className="space-y-2">
        {filas.map((f, i) => (
          <div key={i} className="grid grid-cols-[1fr_70px_110px_auto] items-center gap-2">
            <select value={f.item} aria-label="Producto" className={campo} style={est}
              onChange={(e) => { const o = opciones.find((x) => x.valor === e.target.value); cambiar(i, { item: e.target.value, costo: f.costo || (o?.costo != null ? String(o.costo) : "") }); }}>
              <option value="">Elegí un producto…</option>
              {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
            </select>
            <input value={f.cantidad} onChange={(e) => cambiar(i, { cantidad: e.target.value })} inputMode="numeric" aria-label="Cantidad" className={campo} style={est} />
            <input value={f.costo} onChange={(e) => cambiar(i, { costo: e.target.value })} inputMode="decimal" placeholder="Costo c/u" aria-label="Costo por unidad" className={campo} style={est} />
            <button type="button" onClick={() => setFilas((fs) => fs.length > 1 ? fs.filter((_, j) => j !== i) : [vacia()])} className="muted px-2 hover:text-red-600" aria-label="Quitar fila">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => setFilas((fs) => [...fs, vacia()])} className="link text-sm">+ Agregar otro producto</button>
      </div>
      <label className="field"><span>Notas</span><input value={notas} onChange={(e) => setNotas(e.target.value)} /></label>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
        <span>Total: <b className="text-lg">{pesos(total)}</b></span>
        <button type="button" onClick={guardar} disabled={pendiente} className="btn">{pendiente ? "Guardando…" : "Registrar compra (suma stock)"}</button>
      </div>
      {msg?.error && <p role="alert" className="text-sm text-red-600">{msg.error}</p>}
      {msg?.ok && <p role="status" className="text-sm font-medium" style={{ color: "#15803d" }}>✓ Compra registrada. Se sumó el stock y se actualizaron los costos.</p>}
    </section>
  );
}
