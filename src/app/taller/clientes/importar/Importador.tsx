"use client";

import Link from "next/link";
import { useState } from "react";
import { CAMPOS, leerTexto, mapearClientes, parsearCSV, type FilaCliente } from "@/lib/csv";
import { importarClientes, type ResultadoImportacion } from "./actions";

const ETIQUETAS: Record<keyof FilaCliente, string> = {
  nombre: "Nombre", telefono: "Teléfono", email: "Email", notas: "Notas",
  tipo: "Instrumento", marca: "Marca", modelo: "Modelo", numero_serie: "N° de serie",
};

export function Importador() {
  const [archivo, setArchivo] = useState<string | null>(null);
  const [filas, setFilas] = useState<FilaCliente[]>([]);
  const [columnas, setColumnas] = useState<Partial<Record<keyof FilaCliente, string>>>({});
  const [ignoradas, setIgnoradas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [omitir, setOmitir] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setResultado(null); setError(null); setFilas([]);
    if (!f) return;
    setArchivo(f.name);
    try {
      const { clientes, columnas, ignoradas } = mapearClientes(parsearCSV(leerTexto(await f.arrayBuffer())));
      if (!columnas.nombre) {
        setError("No encontré la columna \"nombre\". Usá la plantilla o renombrá el encabezado.");
        return;
      }
      setFilas(clientes); setColumnas(columnas); setIgnoradas(ignoradas);
    } catch {
      setError("No se pudo leer el archivo. ¿Es un CSV?");
    }
  }

  async function importar() {
    setEnviando(true);
    try {
      setResultado(await importarClientes(filas, omitir));
    } catch (e) {
      setResultado({ creados: 0, instrumentos: 0, omitidos: [], error: (e as Error).message });
    } finally {
      setEnviando(false);
    }
  }

  const validas = filas.filter((f) => f.nombre).length;
  const visibles = CAMPOS.filter((c) => columnas[c]);

  if (resultado) {
    return (
      <div className="card space-y-4">
        {resultado.error ? (
          <p className="text-red-600">{resultado.error}</p>
        ) : (
          <>
            <h2 className="text-xl font-semibold">Importación terminada</h2>
            <p>
              Se crearon <b>{resultado.creados}</b> clientes
              {resultado.instrumentos > 0 && <> y <b>{resultado.instrumentos}</b> instrumentos</>}.
              {resultado.omitidos.length > 0 && <> Se omitieron <b>{resultado.omitidos.length}</b> filas.</>}
            </p>
            {resultado.omitidos.length > 0 && (
              <div className="max-h-72 overflow-auto rounded-xl border" style={{ borderColor: "var(--line)" }}>
                <table className="w-full text-sm">
                  <thead className="muted text-left"><tr><th className="p-2">Fila</th><th className="p-2">Nombre</th><th className="p-2">Motivo</th></tr></thead>
                  <tbody>
                    {resultado.omitidos.map((o) => (
                      <tr key={o.fila} className="border-t" style={{ borderColor: "var(--line)" }}>
                        <td className="p-2 font-mono">{o.fila}</td><td className="p-2">{o.nombre}</td><td className="p-2">{o.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        <div className="flex gap-2">
          <Link href="/taller/clientes" className="btn">Ver clientes</Link>
          <button className="btn-ghost" onClick={() => { setResultado(null); setFilas([]); setArchivo(null); }}>Importar otro archivo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <label className="field">
          <span>Archivo CSV</span>
          <input type="file" accept=".csv,text/csv" onChange={elegir} />
        </label>
        <p className="muted text-sm">
          Columnas reconocidas: <b>nombre</b> (obligatoria), teléfono, email, notas y, si querés cargar su instrumento, instrumento, marca, modelo y n° de serie.
          Sirve el CSV de Excel o Google Sheets (separado por <code>;</code> o <code>,</code>) y el que exporta Contactos de Google.{" "}
          <a href="/plantilla-clientes.csv" download className="link">Descargar plantilla</a>
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {filas.length > 0 && (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="mr-auto">
              <b>{archivo}</b>: {filas.length} filas, {validas} con nombre.
              {ignoradas.length > 0 && <span className="muted text-sm"> Columnas que no se usan: {ignoradas.join(", ")}.</span>}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={omitir} onChange={(e) => setOmitir(e.target.checked)} />
              No cargar los que ya existen (mismo teléfono o email)
            </label>
            <button className="btn" onClick={importar} disabled={enviando || validas === 0}>
              {enviando ? "Importando…" : `Importar ${validas} clientes`}
            </button>
          </div>

          <div className="max-h-[420px] overflow-auto rounded-xl border" style={{ borderColor: "var(--line)" }}>
            <table className="w-full text-sm">
              <thead className="muted sticky top-0 text-left" style={{ background: "var(--card)" }}>
                <tr><th className="p-2">#</th>{visibles.map((c) => <th key={c} className="p-2">{ETIQUETAS[c]}</th>)}</tr>
              </thead>
              <tbody>
                {filas.slice(0, 200).map((f, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "var(--line)", opacity: f.nombre ? 1 : 0.5 }}>
                    <td className="p-2 font-mono muted">{i + 2}</td>
                    {visibles.map((c) => (
                      <td key={c} className="p-2">{f[c] || (c === "nombre" ? <span className="text-red-600">falta</span> : "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filas.length > 200 && <p className="muted text-xs">Mostrando las primeras 200 filas; se importan todas.</p>}
        </div>
      )}
    </div>
  );
}
