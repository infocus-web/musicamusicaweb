import { NextResponse, type NextRequest } from "next/server";
import { obtenerStaff } from "@/lib/auth";
import { rangoMes } from "@/lib/gestion";
import { listarVentas } from "@/lib/ventas";

/** Descarga de ventas en CSV (abre en Excel con acentos y punto y coma). Solo administradores. */
export async function GET(req: NextRequest) {
  const { staff } = await obtenerStaff();
  if (staff?.rol !== "admin") return new NextResponse("Sin permiso", { status: 403 });
  const p = req.nextUrl.searchParams, mes = rangoMes();
  const ok = (d: string | null) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
  const desde = ok(p.get("desde")) ?? mes.desde, hasta = ok(p.get("hasta")) ?? mes.hasta;
  const origen = p.get("origen") ?? "";
  const ventas = await listarVentas(desde, hasta, origen);
  const celda = (v: string | number) => { const s = String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const filas = [["Fecha", "Origen", "Referencia", "Cliente", "Medio de pago", "Monto"],
    ...ventas.map((v) => [v.fecha.split("-").reverse().join("/"), v.origen, v.referencia, v.cliente, v.medio, v.monto.toFixed(2).replace(".", ",")])];
  const csv = "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="ventas_${desde}_${hasta}.csv"` } });
}
